import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { HistoryEvent, LlamaPayContract, Stream, Token, User } from "../../generated/schema";

export function createUser(address: Address, event: ethereum.Event): User {
    let user = User.load(address.toHexString());
    if (user === null) {
        user = new User(address.toHexString());
        user.address = address;
        user.createdTimestamp = event.block.timestamp;
        user.createdBlock = event.block.number;
    }

    user.save();
    return user;
}

export function createStream(streamId: Bytes, event: ethereum.Event, contract: LlamaPayContract, payer: User, payee: User, token: Token, amtPerSec: BigInt): Stream {
    const streamSubgraphId = generateStreamId(contract.address, streamId);
    let stream = Stream.load(streamSubgraphId);
    if (stream === null) {
        stream = new Stream(streamSubgraphId);
        stream.streamId = streamId;
        stream.contract = contract.id;
        stream.users = [payer.id, payee.id];
        stream.payer = payer.id;
        stream.payee = payee.id;
        stream.token = token.id;
        stream.amountPerSec = amtPerSec
        stream.active = true;
        stream.createdTimestamp = event.block.timestamp;
        stream.createdBlock = event.block.number;
    } else {
        stream.active = true;
        stream.createdTimestamp = event.block.timestamp;
        stream.createdBlock = event.block.number;
    }

    stream.save();
    return stream;
}

export function createHistory(event: ethereum.Event, eventType:string, payer: User, oldPayee: User | null, payee: User, stream: Stream, oldStream: Stream | null, amount: BigInt | null): HistoryEvent {
    const historyId = generateHistoryId(event.address, event.transaction.hash)
    let historyEvent = new HistoryEvent(historyId);
    historyEvent.txHash = event.transaction.hash;
    historyEvent.eventType = eventType;
    historyEvent.stream = stream.id;
    if (oldPayee !== null && oldStream !== null) {
        historyEvent.users = [payer.id, payee.id, oldPayee.id];
        historyEvent.oldStream = oldStream.id;
    } else {
        historyEvent.users = [payer.id, payee.id];
    }
    if (amount !== null) {
        historyEvent.amountWithdrawn = amount;
    }
    historyEvent.createdTimestamp = event.block.timestamp;
    historyEvent.createdBlock = event.block.number;
    
    historyEvent.save();
    return historyEvent;
}

export function generateStreamId(contractAddress: Bytes, streamId: Bytes): string {
    return `${contractAddress.toHexString()}-${streamId.toHexString()}`;
}

export function generateHistoryId(contractAddress: Bytes, txHash: Bytes): string {
    return `${contractAddress.toHexString()}-${txHash.toHexString()}`;
}
