import {
  StreamCancelled,
  StreamCreated,
} from "../../generated/templates/LlamaPay/LlamaPay";
import { LlamaPayContract, Stream, User } from "../../generated/schema";

export function onStreamCreated(event: StreamCreated): void {
  let contract = LlamaPayContract.load(event.address.toString());
  let payer = User.load(event.params.from.toString());
  let payee = User.load(event.params.to.toString());
  if (contract === null) return;
  if (payer === null) {
    payer = new User(event.params.from.toString());
    payer.address = event.params.from;
    payer.streamsAsPayer = [];
    payer.streamsAsPayee = [];
    payer.createdTimestamp = event.block.timestamp;
    payer.createdBlock = event.block.number;
  }
  if (payee === null) {
    payee = new User(event.params.to.toString());
    payee.address = event.params.to;
    payee.streamsAsPayer = [];
    payee.streamsAsPayee = [];
    payee.createdTimestamp = event.block.timestamp;
    payee.createdBlock = event.block.number;
  }
  let stream = new Stream(event.params.streamId.toString());
  stream.streamId = event.params.streamId;
  stream.contract = contract.id;
  stream.payer = payer.id;
  stream.payee = payee.id;
  stream.active = true;
  stream.amountPerSec = event.params.amountPerSec;
  stream.createdTimestamp = event.block.timestamp;
  stream.createdBlock = event.block.number;

  contract.streams.push(stream.id);
  payer.streamsAsPayer.push(stream.id);
  payee.streamsAsPayee.push(stream.id);

  payer.save();
  payee.save();
  stream.save();
  contract.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  let stream = Stream.load(event.params.streamId.toString());
  if (stream === null) return;
  stream.active = false;
  stream.save();
}
