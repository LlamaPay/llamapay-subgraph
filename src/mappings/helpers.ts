import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { LlamaPayContract, Stream, Token, User } from "../../generated/schema";

export function loadUser(address: Address, timestamp: BigInt, block: BigInt): User {
    // Load User
    let user = User.load(address.toHexString());
    // If User doesn't exist, then create a new User entity
    if (user === null) {
        user = new User(address.toHexString());
        user.address = address;
        user.createdTimestamp = timestamp;
        user.createdBlock = block;
    }
    // Save and return
    user.save();
    return user;
}

export function loadStream(contractAddress: Address, streamId: Bytes, contract: LlamaPayContract, payer: User, payee: User, token: Token, amountPerSec: BigInt, block: BigInt, timestamp: BigInt): Stream {
    // Unique stream id
    const entityId = `${contractAddress}-${streamId}`;
    // Load Stream
    let stream = Stream.load(entityId);
    if (stream === null) {
        stream = new Stream(entityId);
        stream.streamId = streamId;
        stream.contract = contract.id;
        stream.users = [payer.id, payee.id];
        stream.payer = payer.id;
        stream.payee = payee.id;
        stream.token = token.id;
        stream.amountPerSec = amountPerSec;
        stream.active = false;
        stream.paused = false;
        stream.lastPaused = new BigInt(0);
        stream.pausedAmount = new BigInt(0);
        stream.createdTimestamp = timestamp;
        stream.createdBlock = block;
    }
    // Save and return
    stream.save();
    return stream;
}