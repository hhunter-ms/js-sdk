// package: dapr.proto.operator.v1
// file: dapr/proto/operator/v1/operator.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as dapr_proto_operator_v1_operator_pb from "../../../../dapr/proto/operator/v1/operator_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

interface IOperatorService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    componentUpdate: IOperatorService_IComponentUpdate;
    listComponents: IOperatorService_IListComponents;
    getConfiguration: IOperatorService_IGetConfiguration;
    listSubscriptions: IOperatorService_IListSubscriptions;
}

interface IOperatorService_IComponentUpdate extends grpc.MethodDefinition<dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest, dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent> {
    path: "/dapr.proto.operator.v1.Operator/ComponentUpdate";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest>;
    responseSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
    responseDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
}
interface IOperatorService_IListComponents extends grpc.MethodDefinition<dapr_proto_operator_v1_operator_pb.ListComponentsRequest, dapr_proto_operator_v1_operator_pb.ListComponentResponse> {
    path: "/dapr.proto.operator.v1.Operator/ListComponents";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.ListComponentsRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.ListComponentsRequest>;
    responseSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.ListComponentResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.ListComponentResponse>;
}
interface IOperatorService_IGetConfiguration extends grpc.MethodDefinition<dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, dapr_proto_operator_v1_operator_pb.GetConfigurationResponse> {
    path: "/dapr.proto.operator.v1.Operator/GetConfiguration";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.GetConfigurationRequest>;
    requestDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.GetConfigurationRequest>;
    responseSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.GetConfigurationResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.GetConfigurationResponse>;
}
interface IOperatorService_IListSubscriptions extends grpc.MethodDefinition<google_protobuf_empty_pb.Empty, dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse> {
    path: "/dapr.proto.operator.v1.Operator/ListSubscriptions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<google_protobuf_empty_pb.Empty>;
    requestDeserialize: grpc.deserialize<google_protobuf_empty_pb.Empty>;
    responseSerialize: grpc.serialize<dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse>;
    responseDeserialize: grpc.deserialize<dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse>;
}

export const OperatorService: IOperatorService;

export interface IOperatorServer extends grpc.UntypedServiceImplementation {
    componentUpdate: grpc.handleServerStreamingCall<dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest, dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
    listComponents: grpc.handleUnaryCall<dapr_proto_operator_v1_operator_pb.ListComponentsRequest, dapr_proto_operator_v1_operator_pb.ListComponentResponse>;
    getConfiguration: grpc.handleUnaryCall<dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, dapr_proto_operator_v1_operator_pb.GetConfigurationResponse>;
    listSubscriptions: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse>;
}

export interface IOperatorClient {
    componentUpdate(request: dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
    componentUpdate(request: dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
    listComponents(request: dapr_proto_operator_v1_operator_pb.ListComponentsRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListComponentResponse) => void): grpc.ClientUnaryCall;
    listComponents(request: dapr_proto_operator_v1_operator_pb.ListComponentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListComponentResponse) => void): grpc.ClientUnaryCall;
    listComponents(request: dapr_proto_operator_v1_operator_pb.ListComponentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListComponentResponse) => void): grpc.ClientUnaryCall;
    getConfiguration(request: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse) => void): grpc.ClientUnaryCall;
    getConfiguration(request: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse) => void): grpc.ClientUnaryCall;
    getConfiguration(request: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse) => void): grpc.ClientUnaryCall;
    listSubscriptions(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse) => void): grpc.ClientUnaryCall;
    listSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse) => void): grpc.ClientUnaryCall;
    listSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse) => void): grpc.ClientUnaryCall;
}

export class OperatorClient extends grpc.Client implements IOperatorClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public componentUpdate(request: dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
    public componentUpdate(request: dapr_proto_operator_v1_operator_pb.ComponentUpdateRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<dapr_proto_operator_v1_operator_pb.ComponentUpdateEvent>;
    public listComponents(request: dapr_proto_operator_v1_operator_pb.ListComponentsRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListComponentResponse) => void): grpc.ClientUnaryCall;
    public listComponents(request: dapr_proto_operator_v1_operator_pb.ListComponentsRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListComponentResponse) => void): grpc.ClientUnaryCall;
    public listComponents(request: dapr_proto_operator_v1_operator_pb.ListComponentsRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListComponentResponse) => void): grpc.ClientUnaryCall;
    public getConfiguration(request: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse) => void): grpc.ClientUnaryCall;
    public getConfiguration(request: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse) => void): grpc.ClientUnaryCall;
    public getConfiguration(request: dapr_proto_operator_v1_operator_pb.GetConfigurationRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.GetConfigurationResponse) => void): grpc.ClientUnaryCall;
    public listSubscriptions(request: google_protobuf_empty_pb.Empty, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse) => void): grpc.ClientUnaryCall;
    public listSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse) => void): grpc.ClientUnaryCall;
    public listSubscriptions(request: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: dapr_proto_operator_v1_operator_pb.ListSubscriptionsResponse) => void): grpc.ClientUnaryCall;
}
