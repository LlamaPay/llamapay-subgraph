import { Address, BigInt, ByteArray, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts";
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
    const streamHash = generateStreamHash(contract.address, payer.address, payee.address, amtPerSec);
    let stream = Stream.load(streamHash);
    if (stream === null) {
        stream = new Stream(streamHash);
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
    }
    stream.save();
    return stream;
}

export function createHistory(event: ethereum.Event, eventType:string, payer: User, oldPayee: User | null, payee: User, stream: Stream, oldStream: Stream | null): HistoryEvent {
    let historyEvent = new HistoryEvent(event.transaction.hash.toHexString());
    historyEvent.txHash = event.transaction.hash;
    historyEvent.eventType = eventType;
    historyEvent.stream = stream.id;
    if (oldPayee !== null && oldStream !== null) {
        historyEvent.users = [payer.id, payee.id, oldPayee.id];
        historyEvent.oldStream = oldStream.id;
    } else {
        historyEvent.users = [payer.id, payee.id];
    }
    historyEvent.createdTimestamp = event.block.timestamp;
    historyEvent.createdBlock = event.block.number;
    historyEvent.save();
    return historyEvent;
}

export function generateStreamHash(contractAddress: Bytes, payerAddress:Bytes, payeeAddress:Bytes, amountPerSec: BigInt): string {
    const input = `${contractAddress.toHexString()}${payerAddress.toHexString()}${payeeAddress.toHexString()}${amountPerSec.toHexString()}`
    return crypto.keccak256(ByteArray.fromUTF8(input)).toHexString();
}
