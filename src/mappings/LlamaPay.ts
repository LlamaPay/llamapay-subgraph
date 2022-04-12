import {
  StreamCancelled,
  StreamCreated,
  StreamModified,
} from "../../generated/templates/LlamaPay/LlamaPay";
import {
  LlamaPayContract,
  Stream,
  Token,
} from "../../generated/schema";
import { createHistory, createStream, createUser, generateStreamHash } from "./helpers";

export function onStreamCreated(event: StreamCreated): void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;
  const token = Token.load(contract.token)!;
  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  const stream = createStream(event.params.streamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "StreamCreated", payer, null, payee, stream, null);
  contract.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;
  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  const streamHash = generateStreamHash(contract.address, payer.address, payee.address, event.params.amountPerSec);
  const stream = Stream.load(streamHash)!;
  stream.active = false;
  createHistory(event, "StreamCancelled", payer, null, payee, stream, null);
  stream.save();
}

export function onStreamModified(event: StreamModified): void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;
  const payer = createUser(event.params.from, event);
  const oldPayee = createUser(event.params.oldTo, event);
  const payee = createUser(event.params.to, event);
  const oldStreamHash = generateStreamHash(contract.address, payer.address, oldPayee.address, event.params.oldAmountPerSec);
  const oldStream = Stream.load(oldStreamHash)!;
  const token = Token.load(contract.token)!;
  oldStream.active = false;
  const stream = createStream(event.params.newStreamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "StreamModified", payer, oldPayee, payee, stream, oldStream);
  contract.save();
  oldStream.save();
}