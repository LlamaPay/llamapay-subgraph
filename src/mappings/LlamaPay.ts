import {
  StreamCancelled,
  StreamCreated,
} from "../../generated/templates/LlamaPay/LlamaPay";
import {
  HistoryEvent,
  LlamaPayContract,
  Stream,
  User,
} from "../../generated/schema";

// Handles StreamCreated and Modify Stream
export function onStreamCreated(event: StreamCreated): void {
  // Load nodes
  let contract = LlamaPayContract.load(event.address.toHexString());
  let payer = User.load(event.params.from.toHexString());
  let payee = User.load(event.params.to.toHexString());
  let historyEvent = HistoryEvent.load(event.transaction.hash.toHexString());
  if (contract === null) return;
  // Create new payer if payer node is null
  if (payer === null) {
    payer = new User(event.params.from.toHexString());
    payer.address = event.params.from;
    payer.createdTimestamp = event.block.timestamp;
    payer.createdBlock = event.block.number;
  }
  // Create new payee if payee node is null
  if (payee === null) {
    payee = new User(event.params.to.toHexString());
    payee.address = event.params.to;
    payee.createdTimestamp = event.block.timestamp;
    payee.createdBlock = event.block.number;
  }
  // If history event doesn't === null then it means that it's the transaction for modify stream
  // Since modify stream fires off StreamCancelled AND StreamCreated and the history event ID === transaction hash
  // We can just replace the StreamCancelled history event with StreamModified
  if (historyEvent !== null) {
    historyEvent.eventType = "StreamModified";
    historyEvent.oldStream = historyEvent.stream;
  }
  // Create stream node
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

  // Create history event with type StreamCreated if historyEvent node doesn't exist
  if (historyEvent === null) {
    historyEvent = new HistoryEvent(event.transaction.hash.toHexString());
    historyEvent.eventType = "StreamCreated";
  }
  historyEvent.stream = stream.id;
  historyEvent.users = [payer.id, payee.id];
  historyEvent.createdTimestamp = event.block.timestamp;
  historyEvent.createdBlock = event.block.number;

  historyEvent.save();
  payer.save();
  payee.save();
  stream.save();
  contract.save();
}

// Handles StreamCancelled and Modify Stream
export function onStreamCancelled(event: StreamCancelled): void {
  let stream = Stream.load(event.params.streamId.toHexString());
  let payer = User.load(event.params.from.toHexString());
  let payee = User.load(event.params.to.toHexString());
  if (stream === null || payer === null || payee === null) return;
  stream.active = false;

  let historyEvent = new HistoryEvent(event.transaction.hash.toHexString());
  historyEvent.eventType = "StreamCancelled";
  historyEvent.stream = stream.id;
  historyEvent.users = [payer.id, payee.id];
  historyEvent.createdTimestamp = event.block.timestamp;
  historyEvent.createdBlock = event.block.number;

  historyEvent.save();
  payer.save();
  payee.save();
  stream.save();
}
