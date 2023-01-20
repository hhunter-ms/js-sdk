/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import express from "express";
import fetch from "node-fetch";
import { CommunicationProtocolEnum, DaprServer, HttpMethod } from "../../../src";
import { DaprInvokerCallbackContent } from "../../../src/types/DaprInvokerCallback.type";
import { KeyValueType } from "../../../src/types/KeyValue.type";

const serverHost = "127.0.0.1";
const serverPort = "50001";
const daprHost = "127.0.0.1";
const daprPort = "50000"; // Dapr Sidecar Port of this Example Server
const daprAppId = "test-suite";

describe("http/server", () => {
  let server: DaprServer;
  const mockBindingReceive = jest.fn(async (_data: object) => null);
  const mockPubSub = jest.fn(async (_data: object) => null);
  const mockInvoke = jest.fn(async (_data: object) => null);
  const mockPubSubWithHeaders = jest.fn(async (_data: object, _headers: object) => null);
  const mockPubSubError = jest.fn(async (_data: object) => {
    throw new Error("DROPPING MESSAGE");
  });

  // We need to start listening on some endpoints already
  // this because Dapr is not dynamic and registers endpoints on boot
  // we put a timeout of 10s since it takes around 4s for Dapr to boot up
  beforeAll(async () => {
    server = new DaprServer(
      serverHost,
      serverPort,
      daprHost,
      daprPort,
      CommunicationProtocolEnum.HTTP,
      { maxBodySizeMb: 20 }, // we set sending larger than receiving to test the error handling
      { maxBodySizeMb: 10 },
    );

    await server.binding.receive("binding-mqtt", mockBindingReceive);

    // Test with:
    // dapr publish --publish-app-id test-suite --pubsub pubsub-redis --topic test-topic --data '{ "hello": "world" }'
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-1", {});
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-2", {
      deadLetterTopic: "my-deadletter-topic",
    });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-3", {
      deadLetterTopic: "my-deadletter-topic",
      deadLetterCallback: mockPubSub,
    });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-4", { deadLetterCallback: mockPubSub });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-5", {
      callback: mockPubSubError,
      deadLetterCallback: mockPubSub,
    });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-6", { callback: mockPubSub });
    await server.pubsub.subscribeWithOptions("pubsub-redis", "topic-options-7", {
      route: {
        default: "/default",
        rules: [
          {
            match: `event.type == "my-type-1"`,
            path: "/type-1",
          },
          {
            match: `event.type == "my-type-2"`,
            path: "/type-2",
          },
        ],
      },
    });

    await server.pubsub.subscribe("pubsub-redis", "topic-1", mockPubSub);
    await server.pubsub.subscribe("pubsub-redis", "topic-2", mockPubSub, "single-route");
    await server.pubsub.subscribe("pubsub-redis", "topic-3", mockPubSub, "/no-leading-slash");
    await server.pubsub.subscribe("pubsub-redis", "topic-4", mockPubSub, {
      default: "/default",
      rules: [
        {
          match: `event.type == "my-type-1"`,
          path: "/type-1",
        },
        {
          match: `event.type == "my-type-2"`,
          path: "/type-2",
        },
      ],
    });
    await server.pubsub.subscribe("pubsub-redis", "topic-5", mockPubSubWithHeaders);
    await server.pubsub.subscribe("pubsub-redis", "test-topic-ce-raw", mockPubSub, undefined, { rawPayload: true });
    await server.pubsub.subscribe("pubsub-redis", "test-topic-raw-raw", mockPubSub, undefined, { rawPayload: true });
    await server.pubsub.subscribe("pubsub-redis", "test-topic-raw-ce", mockPubSub);

    // Start server
    await server.start();
  }, 10 * 1000);

  beforeEach(() => {
    mockBindingReceive.mockClear();
    mockInvoke.mockClear();
    mockPubSub.mockClear();
    mockPubSubError.mockClear();
    mockPubSubWithHeaders.mockClear();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("server", () => {
    it("should allow us to pass a custom HTTP Server", async () => {
      const myApp = express();

      myApp.get("/my-custom-endpoint", (req, res) => {
        res.send({ msg: "My own express app!" });
      });

      const myAppDaprServer = new DaprServer(
        serverHost,
        "50002",
        daprHost,
        daprPort,
        CommunicationProtocolEnum.HTTP,
        {},
        {
          serverHttp: myApp,
        },
      );

      // initialize subscribtions, ... before server start
      // the dapr sidecar relies on these
      // this will also initialize the app server itself (removing the need for app.listen to be called)
      await myAppDaprServer.start();

      // Try to call the custom endpoint
      const res = await fetch(`http://${serverHost}:50002/my-custom-endpoint`);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toBeDefined();
      expect(json.msg).toBe("My own express app!");

      // Should still be able to call Dapr endpoints
      // Note: we call manually instead of using the server.client as the server is not running on the default port
      await myAppDaprServer.invoker.listen("dapr-endpoint", mockInvoke, { method: HttpMethod.POST });

      await fetch(`http://${serverHost}:50002/dapr-endpoint`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      expect(mockInvoke).toHaveBeenCalledTimes(1);

      // Cleanup the resources
      await myAppDaprServer.stop();
    });

    it("should be able to receive payloads larger than 4 MB", async () => {
      await new Promise((resolve, _reject) => setTimeout(resolve, 1000));

      // Create a 5Mb payload
      const payload = new Uint8Array(5 * 1024 * 1024);

      await server.invoker.listen("invoke-large-payload-1", mockInvoke, { method: HttpMethod.POST });
      await server.client.invoker.invoke(daprAppId, "invoke-large-payload-1", HttpMethod.POST, payload);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if the receive payload is larger than 4 MB and we did not configure a larger size", async () => {
      const payload = new Uint8Array(11 * 1024 * 1024);
      await server.invoker.listen("invoke-large-payload-2", mockInvoke, { method: HttpMethod.POST });

      try {
        await server.client.invoker.invoke(daprAppId, "invoke-large-payload-2", HttpMethod.POST, payload);
      } catch (e: any) {
        // https://nodejs.org/dist/latest/docs/api/errors.html
        // we will receive EPIPE if server closes
        // on upload this is if the body is too large
        expect(e.message).toBeDefined();
      }

      expect(mockInvoke).not.toHaveBeenCalledTimes(1);
    });
  });

  describe("binding", () => {
    it("should be able to receive events", async () => {
      await server.client.binding.send("binding-mqtt", "create", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 2000));

      expect(mockBindingReceive.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockBindingReceive.mock.calls[0][0]["hello"]).toEqual("world");
    });
  });

  describe("pubsub", () => {
    it("should be able to send and receive plain events", async () => {
      await server.client.pubsub.publish("pubsub-redis", "topic-1", "Hello, world!");

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSub.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]).toEqual("Hello, world!");
    });

    it("should be able to send and receive JSON events", async () => {
      await server.client.pubsub.publish("pubsub-redis", "topic-1", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSub.mock.calls.length).toBe(1);

      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["hello"]).toEqual("world");
    });

    it("should be able to send and receive cloud events", async () => {
      const ce = {
        specversion: "1.0",
        type: "com.github.pull.create",
        source: "https://github.com/cloudevents/spec/pull",
        id: "A234-1234-1234",
      };

      await server.client.pubsub.publish("pubsub-redis", "topic-1", ce);

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 500));

      expect(mockPubSub.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["specversion"]).toEqual(ce.specversion);
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["type"]).toEqual(ce.type);
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["source"]).toEqual(ce.source);
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["id"]).toEqual(ce.id);
    });

    it("should be able to receive events with their respective headers", async () => {
      await server.client.pubsub.publish("pubsub-redis", "topic-5", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSubWithHeaders.mock.calls.length).toBe(1);

      // Also test for receiving data
      expect(mockPubSubWithHeaders.mock.calls[0][1]).toHaveProperty("content-type");
      expect(mockPubSubWithHeaders.mock.calls[0][1]).toHaveProperty("content-length");
      expect(mockPubSubWithHeaders.mock.calls[0][1]).toHaveProperty("pubsubname");
    });

    it("should be able to send and receive events when using options callback without a route", async () => {
      await server.client.pubsub.publish("pubsub-redis", "topic-options-6", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mockPubSub.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["hello"]).toEqual("world");
    });

    it("should only allow one subscription per topic", async () => {
      const mock = jest.fn(async (_data: object) => null);

      try {
        let server2 = new DaprServer("127.0.0.1", "50002", daprHost, daprPort, CommunicationProtocolEnum.HTTP);
        await server2.pubsub.subscribe("pubsub-redis", "demo-topic", mock);
        await server2.pubsub.subscribe("pubsub-redis", "demo-topic", mock, "/test");
        server2 = undefined as any; // clean it up
      } catch (e: any) {
        expect(e.message).toEqual(
          "The topic 'demo-topic' is already being subscribed to on PubSub 'pubsub-redis', there can only be one topic registered.",
        );
      }
    });

    it("should be able to send cloud event and receive raw payload", async () => {
      const res = await server.client.pubsub.publish("pubsub-redis", "test-topic-ce-raw", { hello: "world-ce-raw" });
      expect(res.error).toBeUndefined();

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
      expect(mockPubSub.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      const rawData = mockPubSub.mock.calls[0][0]["data_base64"];
      const data = JSON.parse(Buffer.from(rawData, "base64").toString());
      // @ts-ignore
      expect(data["data"]["hello"]).toEqual("world-ce-raw");
    });

    it("should be able to send raw payload and receive raw payload", async () => {
      const res = await server.client.pubsub.publish(
        "pubsub-redis",
        "test-topic-raw-raw",
        { hello: "world-raw-raw" },
        { rawPayload: true },
      );
      expect(res.error).toBeUndefined();

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
      expect(mockPubSub.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      const rawData = mockPubSub.mock.calls[0][0]["data_base64"];
      const data = JSON.parse(Buffer.from(rawData, "base64").toString());
      // @ts-ignore
      expect(data["hello"]).toEqual("world-raw-raw");
    });

    it("should be able to send raw payload and receive cloud event", async () => {
      const res = await server.client.pubsub.publish(
        "pubsub-redis",
        "test-topic-raw-ce",
        { hello: "world-raw-ce" },
        { rawPayload: true },
      );
      expect(res.error).toBeUndefined();

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));
      expect(mockPubSub.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSub.mock.calls[0][0]["hello"]).toEqual("world-raw-ce");
    });

    it("should receive if it was successful or not", async () => {
      const res = await server.client.pubsub.publish("pubsub-redis", "topic-demo", { hello: "world" });
      expect(res.error).toBeUndefined();
    });

    it('should create route "default" if we don\'t provide a route', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-1",
          route: "/pubsub-redis--topic-1--default",
        }),
      );
    });

    it('should create route "single-route" if we provide a single route', async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-2",
          route: "/pubsub-redis--topic-2--single-route",
        }),
      );
    });

    it("should create route and remove the leading slash if a route was provided with leading slash", async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-3",
          route: "/pubsub-redis--topic-3--no-leading-slash",
        }),
      );
    });

    it("should allow us to create a route on the Dapr Spec with rules and default", async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-4",
          routes: {
            default: "/pubsub-redis--topic-4--default",
            rules: [
              {
                match: `event.type == "my-type-1"`,
                path: "/pubsub-redis--topic-4--type-1",
              },
              {
                match: `event.type == "my-type-2"`,
                path: "/pubsub-redis--topic-4--type-2",
              },
            ],
          },
        }),
      );
    });

    it("should allow us to create a route on the Dapr Spec with rules and default through subscribeWithOptions", async () => {
      const subs = server.pubsub.getSubscriptions();

      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-options-7",
          routes: {
            default: "/pubsub-redis--topic-options-7--default",
            rules: [
              {
                match: `event.type == "my-type-1"`,
                path: "/pubsub-redis--topic-options-7--type-1",
              },
              {
                match: `event.type == "my-type-2"`,
                path: "/pubsub-redis--topic-options-7--type-2",
              },
            ],
          },
        }),
      );
    });

    it("should correctly work if we provide a single route with custom options", async () => {
      const res = await server.client.pubsub.publish("pubsub-redis", "topic-route-empty", { hello: "world" });
      expect(res.error).toBeUndefined();
    });

    it("should allow us to register a listener without event handler callback", async () => {
      const subs = server.pubsub.getSubscriptions();
      expect(JSON.stringify(subs)).toContain(
        JSON.stringify({
          pubsubname: "pubsub-redis",
          topic: "topic-options-1",
          route: "/pubsub-redis--topic-options-1--default",
        }),
      );
    });

    it("should allow us to register an event handler after the server started", async () => {
      const countEventHandlers =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-1"].routes["default"].eventHandlers.length;
      server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-1", "", async () => null);
      const countEventHandlersNew =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-1"].routes["default"].eventHandlers.length;
      expect(countEventHandlersNew).toEqual(countEventHandlers + 1);
    });

    it("should provide a deadletter route if we pass a deadletter topic to the options", async () => {
      const subs = server.pubsub.getSubscriptions();
      expect(JSON.stringify(subs)).toContain("pubsub-redis--topic-options-2--my-deadletter-topic");
    });

    it("should allow us to listen on the deadletter topic", async () => {
      const countEventHandlers =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-2"].routes["my-deadletter-topic"].eventHandlers
          .length;
      server.pubsub.subscribeToRoute("pubsub-redis", "topic-options-2", "my-deadletter-topic", async () => null);
      const countEventHandlersNew =
        server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-2"].routes["my-deadletter-topic"].eventHandlers
          .length;
      expect(countEventHandlersNew).toEqual(countEventHandlers + 1);
    });

    it("should allow us to provide deadletter support through subscribeWithOptions with named deadletter route", async () => {
      const routes = server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-3"].routes;

      // Ensure the topic is named as we passed it
      expect(Object.keys(routes)).toContain("my-deadletter-topic");

      // Ensure it has an event handler bound to it
      expect(routes["my-deadletter-topic"].eventHandlers.length).toBeGreaterThan(0);
    });

    it("should allow us to provide deadletter support through subscribeWithOptions with a default deadletter route if none was provided", async () => {
      const routes = server.pubsub.getSubscriptions()["pubsub-redis"]["topic-options-4"].routes;

      // Ensure the topic is named with the default "deadletter" if none was provided
      expect(Object.keys(routes)).toContain("deadletter");

      // Ensure it has an event handler bound to it
      expect(routes["deadletter"].eventHandlers.length).toBeGreaterThan(0);
    });

    it("should be able to send and receive events through deadletter", async () => {
      // This call will throw an error on mock mockPubSubRouteDeadletterErrorHandle
      await server.client.pubsub.publish("pubsub-redis", "topic-options-5", { hello: "world" });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      // We expect that deadletter was handled
      expect(mockPubSubError.mock.calls.length).toBe(1);

      // Also test for receiving data
      // @ts-ignore
      expect(mockPubSubError.mock.calls[0][0]["hello"]).toEqual("world");
    });
  });

  describe("invoker", () => {
    it("should be able to listen and invoke a service with GET", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.GET);

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it("should be able to listen and invoke a service with POST data", async () => {
      const mock = jest.fn(async (_data: object) => ({ hello: "world" }));

      await server.invoker.listen("hello-world", mock, { method: HttpMethod.POST });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world", HttpMethod.POST, {
        hello: "world",
      });

      // Delay a bit for event to arrive
      // await new Promise((resolve, reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      expect(JSON.stringify(res)).toEqual(`{"hello":"world"}`);
    });

    it("should be able to listen and invoke a service with headers", async () => {
      const mock = jest.fn(async (data: DaprInvokerCallbackContent) => data.headers);

      await server.invoker.listen("hello-world-headers", mock, { method: HttpMethod.GET });
      const res = await server.client.invoker.invoke(daprAppId, "hello-world-headers", HttpMethod.GET, undefined, {
        headers: { "x-foo": "bar-baz" },
      });

      // Delay a bit for event to arrive
      await new Promise((resolve, _reject) => setTimeout(resolve, 250));

      expect(mock.mock.calls.length).toBe(1);
      const headers = res as KeyValueType;
      expect(headers["x-foo"]).toEqual("bar-baz");
    });
  });
});