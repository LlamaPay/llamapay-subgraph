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
import { createHistory, createStream, createUser } from "./helpers";

export function onStreamCreated(event: StreamCreated): void {
  const contract = LlamaPayContract.load(event.address.toHexString());
  if (contract === null) return;
  const token = Token.load(contract.token);
  if (token === null) return;
  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  const stream = createStream(event.params.streamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "StreamCreated", payer, null, payee, stream, null);
  contract.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  const stream = Stream.load(event.params.streamId.toHexString());
  if (stream === null) return;
  stream.active = false;
  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  createHistory(event, "StreamCancelled", payer, null, payee, stream, null);
  stream.save();
}

export function onStreamModified(event: StreamModified): void {
  const contract = LlamaPayContract.load(event.address.toHexString());
  const oldStream = Stream.load(event.params.oldStreamId.toHexString());
  if (contract === null || oldStream === null) return;
  const token = Token.load(contract.token);
  if (token === null) return;
  oldStream.active = false;
  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  const oldPayee = createUser(event.params.oldTo, event);
  const stream = createStream(event.params.newStreamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "StreamModified", payer, oldPayee, payee, stream, oldStream);
  contract.save();
  oldStream.save();
}