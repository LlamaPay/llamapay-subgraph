import {
  StreamCancelled,
  StreamCreated,
  StreamModified,
} from "../../generated/templates/LlamaPay/LlamaPay";
import {
  HistoryEvent,
  LlamaPayContract,
  Stream,
  User,
} from "../../generated/schema";

export function onStreamCreated(event: StreamCreated): void {
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  const hash = event.transaction.hash;
  let contract = LlamaPayContract.load(event.address.toHexString());
  if (contract === null) return;
  let payer = User.load(event.params.from.toHexString());
  if (payer === null) {
    payer = new User(event.params.from.toHexString());
    payer.address = event.params.from;
    payer.createdTimestamp = timestamp;
    payer.createdBlock = block;
  }
  let payee = User.load(event.params.to.toHexString());
  if (payee === null) {
    payee = new User(event.params.to.toHexString());
    payee.address = event.params.to;
    payee.createdTimestamp = timestamp;
    payee.createdBlock = block;
  }
  let stream = new Stream(event.params.streamId.toHexString());
  stream.streamId = event.params.streamId;
  stream.contract = contract.id;
  stream.users = [payer.id, payee.id];
  stream.payer = payer.id;
  stream.payee = payee.id;
  stream.token = contract.token;
  stream.amountPerSec = event.params.amountPerSec;
  stream.active = true;
  stream.createdTimestamp = timestamp;
  stream.createdBlock = block;

  let historyEvent = new HistoryEvent(hash.toHexString());
  historyEvent.id = hash.toHexString();
  historyEvent.eventType = "StreamCreated";
  historyEvent.txHash = hash;
  historyEvent.users = [payer.id, payee.id];
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save();
  payer.save();
  payee.save();
  stream.save();
  contract.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  const hash = event.transaction.hash;
  let stream = Stream.load(event.params.streamId.toHexString());
  let payer = User.load(event.params.from.toHexString());
  let payee = User.load(event.params.to.toHexString());
  if (stream === null || payer === null || payee === null) return;
  stream.active = false;
  let historyEvent = new HistoryEvent(hash.toHexString());
  historyEvent.id = hash.toHexString();
  historyEvent.eventType = "StreamCancelled";
  historyEvent.txHash = hash;
  historyEvent.users = [payer.id, payee.id];
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save();
  stream.save();
  payer.save();
  payee.save();
}

export function onStreamModified(event: StreamModified): void {
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  const hash = event.transaction.hash;
  let contract = LlamaPayContract.load(event.address.toHexString());
  let oldStream = Stream.load(event.params.oldStreamId.toHexString());
  let oldPayee = User.load(event.params.oldTo.toHexString());
  if (oldStream === null || contract === null || oldPayee === null) return;
  let payer = User.load(event.params.from.toHexString());
  if (payer === null) {
    payer = new User(event.params.from.toHexString());
    payer.address = event.params.from;
    payer.createdTimestamp = timestamp;
    payer.createdBlock = block;
  }
  let payee = User.load(event.params.to.toHexString());
  if (payee === null) {
    payee = new User(event.params.to.toHexString());
    payee.address = event.params.to;
    payee.createdTimestamp = timestamp;
    payee.createdBlock = block;
  }
  oldStream.active = false;
  let stream = new Stream(event.params.newStreamId.toHexString());
  stream.streamId = event.params.newStreamId;
  stream.contract = contract.id;
  stream.users = [payer.id, payee.id];
  stream.payer = payer.id;
  stream.payee = payee.id;
  stream.token = contract.token;
  stream.amountPerSec = event.params.amountPerSec;
  stream.active = true;
  stream.createdTimestamp = timestamp;
  stream.createdBlock = block;
  let historyEvent = new HistoryEvent(hash.toHexString());
  historyEvent.txHash = hash;
  historyEvent.eventType = "StreamModified";
  historyEvent.users = [payer.id, payee.id, oldPayee.id];
  historyEvent.stream = stream.id;
  historyEvent.oldStream = oldStream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save();
  stream.save();
  payee.save();
  payer.save();
  oldStream.save();
  oldPayee.save();
  contract.save();
}