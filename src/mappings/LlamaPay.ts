import {
  StreamCancelled,
  StreamCreated,
} from "../../generated/templates/LlamaPay/LlamaPay";
import { LlamaPayContract, Stream, User } from "../../generated/schema";

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
  stream.payer = payer.id;
  stream.payee = payee.id;
  stream.active = true;
  stream.amountPerSec = event.params.amountPerSec;
  stream.createdTimestamp = event.block.timestamp;
  stream.createdBlock = event.block.number;

  payer.save();
  payee.save();
  stream.save();
  contract.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  let stream = Stream.load(event.params.streamId.toHexString());
  if (stream === null) return;
  stream.active = false;
  stream.save();
}
