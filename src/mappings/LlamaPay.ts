import {
  StreamCancelled,
  StreamCreated,
} from "../../generated/templates/LlamaPay/LlamaPay";
import { HistoryEvent, LlamaPayContract, Stream, User } from "../../generated/schema";

export function onStreamCreated(event: StreamCreated): void {
  let contract = LlamaPayContract.load(event.address.toHexString());
  let payer = User.load(event.params.from.toHexString());
  let payee = User.load(event.params.to.toHexString());
  if (contract === null) return;
  if (payer === null) {
    payer = new User(event.params.from.toHexString());
    payer.address = event.params.from;
    payer.createdTimestamp = event.block.timestamp;
    payer.createdBlock = event.block.number;
  }
  if (payee === null) {
    payee = new User(event.params.to.toHexString());
    payee.address = event.params.to;
    payee.createdTimestamp = event.block.timestamp;
    payee.createdBlock = event.block.number;
  }
  let stream = new Stream(event.params.streamId.toHexString());
  stream.streamId = event.params.streamId;
  stream.contract = contract.id;
  stream.token = contract.token;
  stream.payer = payer.id;
  stream.payee = payee.id;
  stream.active = true;
  stream.amountPerSec = event.params.amountPerSec;
  stream.createdTimestamp = event.block.timestamp;
  stream.createdBlock = event.block.number;

  let historyEvent = new HistoryEvent(event.transaction.hash.toHexString());
  historyEvent.eventType = "StreamCreated";
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = event.block.timestamp;
  historyEvent.createdBlock = event.block.number;

  historyEvent.save();
  payer.save();
  payee.save();
  stream.save();
  contract.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  let stream = Stream.load(event.params.streamId.toHexString());
  let payer = User.load(event.params.from.toHexString());
  let payee = User.load(event.params.to.toHexString());
  if (stream === null || payer === null || payee === null) return;
  stream.active = false;

  let historyEvent = new HistoryEvent(event.transaction.hash.toHexString());
  historyEvent.eventType = "StreamCancelled";
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = event.block.timestamp;
  historyEvent.createdBlock = event.block.number;

  historyEvent.save();
  payer.save();
  payee.save();
  stream.save();
}
