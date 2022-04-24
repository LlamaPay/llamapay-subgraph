import {
  StreamCancelled,
  StreamCreated,
  StreamModified,
  Withdraw,
} from "../../generated/templates/LlamaPay/LlamaPay";
import {
  LlamaPayContract,
  Stream,
  Token,
} from "../../generated/schema";
import { createHistory, createStream, createUser, generateStreamId } from "./helpers";

export function onStreamCreated(event: StreamCreated): void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;
  const token = Token.load(contract.token)!;

  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  const stream = createStream(event.params.streamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "StreamCreated", payer, null, payee, stream, null, null);
  
  contract.save();
  token.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;

  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);

  const streamSubgraphId = generateStreamId(contract.address, event.params.streamId);
  const stream = Stream.load(streamSubgraphId)!;
  stream.active = false;

  createHistory(event, "StreamCancelled", payer, null, payee, stream, null, null);

  contract.save();
  stream.save();
}

export function onStreamModified(event: StreamModified): void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;

  const payer = createUser(event.params.from, event);
  const oldPayee = createUser(event.params.oldTo, event);
  const payee = createUser(event.params.to, event);

  const oldstreamSubgraphId = generateStreamId(contract.address, event.params.oldStreamId);
  const oldStream = Stream.load(oldstreamSubgraphId)!;
  const token = Token.load(contract.token)!;
  oldStream.active = false;

  const stream = createStream(event.params.newStreamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "StreamModified", payer, oldPayee, payee, stream, oldStream, null);

  contract.save();
  oldStream.save();
  token.save();
}

export function onWithdraw(event: Withdraw):void {
  const contract = LlamaPayContract.load(event.address.toHexString())!;
  const token = Token.load(contract.token)!;
  const payer = createUser(event.params.from, event);
  const payee = createUser(event.params.to, event);
  const stream = createStream(event.params.streamId, event, contract, payer, payee, token, event.params.amountPerSec);
  createHistory(event, "Withdraw", payer, null, payee, stream, null, event.params.amount);

  contract.save();
  token.save();
}