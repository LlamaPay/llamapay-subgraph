import { BigInt } from "@graphprotocol/graph-ts";
import { HistoryEvent, LlamaPayContract, Token } from "../../generated/schema";
import { PayerDeposit, PayerWithdraw, StreamCancelled, StreamCreated, StreamCreatedWithReason, StreamModified, StreamPaused, Withdraw } from "../../generated/templates/LlamaPay/LlamaPay";
import { loadStream, loadUser } from "./helpers";

export function onPayerDeposit(event: PayerDeposit): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const amount = event.params.amount;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;

  // Load Payoor
  const payer = loadUser(payerAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${payerAddress.toHexString()}-${txHash.toHexString()}`

  // Create history entity and fill with values
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = "Deposit"
  historyEvent.users = [payer.id];
  historyEvent.token = token.id;
  historyEvent.amount = amount;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  // Savoooor
  historyEvent.save();
}

export function onWithdraw(event: Withdraw): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const payeeAddress = event.params.to;
  const amountPerSec = event.params.amountPerSec;
  const amount = event.params.amount;
  const streamId = event.params.streamId;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;

  // Load users
  const payer = loadUser(payerAddress, timestamp, block);
  const payee = loadUser(payeeAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Load stream
  const stream = loadStream(contractAddress, streamId, contract, payer, payee, token, amountPerSec, block, timestamp);

  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${streamId.toHexString()}-${txHash.toHexString()}`;

  // Create history entity and fill with values
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = "Withdraw";
  historyEvent.users = [payer.id, payee.id];
  historyEvent.token = token.id;
  historyEvent.stream = stream.id;
  historyEvent.amount = amount;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save();

}

export function onStreamPaused(event: StreamPaused): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const payeeAddress = event.params.to;
  const amountPerSec = event.params.amountPerSec;
  const streamId = event.params.streamId;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;

  // Load users
  const payer = loadUser(payerAddress, timestamp, block);
  const payee = loadUser(payeeAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Load stream
  let stream = loadStream(contractAddress, streamId, contract, payer, payee, token, amountPerSec, block, timestamp);

  // Pause stream and update lastPaused
  stream.paused = true;
  stream.lastPaused = timestamp;
  stream.save();

  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${streamId.toHexString()}-${txHash.toHexString()}`;

  // Create history entity
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = "StreamPaused";
  historyEvent.users = [payer.id, payee.id];
  historyEvent.token = token.id;
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save()
}

export function onStreamCreated(event: StreamCreated ): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const payeeAddress = event.params.to;
  const amountPerSec = event.params.amountPerSec;
  const streamId = event.params.streamId;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  // Load users
  const payer = loadUser(payerAddress, timestamp, block);
  const payee = loadUser(payeeAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Load stream
  let stream = loadStream(contractAddress, streamId, contract, payer, payee, token, amountPerSec, block, timestamp);

  let streamWasPaused = false;

  if (stream.paused) {
    streamWasPaused = true;
    // calculate the amount of tokens they missed out while paused.
    // pausedAmount += (amount per sec * (curr timestamp - last paused))
    const delta = timestamp.minus(stream.lastPaused);
    const addAmount = stream.amountPerSec.times(delta);
    stream.pausedAmount = stream.pausedAmount.plus(addAmount);
    stream.paused = false;
  } else {
    stream.active = true;
    stream.createdTimestamp = timestamp;
    stream.createdBlock = block;
  }
  stream.save();


  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${streamId.toHexString()}-${txHash.toHexString()}`;

  // Create history entity
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = streamWasPaused ? "StreamResumed" : "StreamCreated";
  historyEvent.users = [payer.id, payee.id];
  historyEvent.token = token.id;
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save();
}

export function onStreamModified(event: StreamModified): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const payeeAddress = event.params.to;
  const oldPayeeAddress = event.params.oldTo;
  const amountPerSec = event.params.amountPerSec;
  const oldAmountPerSec = event.params.oldAmountPerSec;
  const streamId = event.params.newStreamId;
  const oldStreamId = event.params.oldStreamId;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  // Load users
  const payer = loadUser(payerAddress, timestamp, block);
  const payee = loadUser(payeeAddress, timestamp, block);
  const oldPayee = loadUser(oldPayeeAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Load streams
  let stream = loadStream(contractAddress, streamId, contract, payer, payee, token, amountPerSec, block, timestamp);
  let oldStream = loadStream(contractAddress, oldStreamId, contract, payer, oldPayee, token, oldAmountPerSec, block, timestamp);

  // Cancel old stream clearing paused data as well
  oldStream.active = false;
  oldStream.paused = false;
  oldStream.pausedAmount = new BigInt(0);
  oldStream.save();

  // Activate new stream
  stream.active = true;
  stream.createdTimestamp = timestamp;
  stream.createdBlock = block;
  stream.save();

  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${streamId.toHexString()}-${oldStreamId.toHexString()}-${txHash.toHexString()}`;

  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = "StreamModified";
  historyEvent.users = [payer.id, payee.id, oldPayee.id];
  historyEvent.token = token.id;
  historyEvent.stream = stream.id;
  historyEvent.oldStream = oldStream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;
  historyEvent.save();
}

export function onStreamCancelled(event: StreamCancelled): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const payeeAddress = event.params.to;
  const amountPerSec = event.params.amountPerSec;
  const streamId = event.params.streamId;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  // Load users
  const payer = loadUser(payerAddress, timestamp, block);
  const payee = loadUser(payeeAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Load stream
  let stream = loadStream(contractAddress, streamId, contract, payer, payee, token, amountPerSec, block, timestamp);

  // Cancel Stream
  stream.active = false;
  stream.paused = false;
  stream.pausedAmount = new BigInt(0);
  stream.save();

  const entityId = `${contractAddress.toHexString()}-${streamId.toHexString()}-${txHash.toHexString()}`;
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = "StreamCancelled";
  historyEvent.users = [payer.id, payee.id];
  historyEvent.token = token.id;
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;
  historyEvent.save();
}

export function onPayerWithdraw(event: PayerWithdraw): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const amount = event.params.amount;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;

  // Load payooor
  const payer = loadUser(payerAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${payerAddress.toHexString()}-${txHash.toHexString()}`

  // Create history entity and fill with values
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = "Withdraw"
  historyEvent.users = [payer.id];
  historyEvent.token = token.id;
  historyEvent.amount = amount;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;
  historyEvent.save();
}

export function onStreamCreatedWithReason(event: StreamCreatedWithReason): void {
  const contractAddress = event.address;
  const payerAddress = event.params.from;
  const payeeAddress = event.params.to;
  const amountPerSec = event.params.amountPerSec;
  const streamId = event.params.streamId;
  const reason = event.params.reason;
  const txHash = event.transaction.hash;
  const timestamp = event.block.timestamp;
  const block = event.block.number;
  // Load users
  const payer = loadUser(payerAddress, timestamp, block);
  const payee = loadUser(payeeAddress, timestamp, block);

  // Load contract
  const contract = LlamaPayContract.load(contractAddress.toHexString())!;

  // Load token
  const token = Token.load(contract.token)!;

  // Load stream
  let stream = loadStream(contractAddress, streamId, contract, payer, payee, token, amountPerSec, block, timestamp);

  let streamWasPaused = false;

  if (stream.paused) {
    streamWasPaused = true;
    // calculate the amount of tokens they missed out while paused.
    // pausedAmount += (amount per sec * (curr timestamp - last paused))
    const delta = timestamp.minus(stream.lastPaused);
    const addAmount = stream.amountPerSec.times(delta);
    stream.pausedAmount = stream.pausedAmount.plus(addAmount);
    stream.paused = false;
  } else {
    stream.active = true;
    stream.createdTimestamp = timestamp;
    stream.createdBlock = block;
  }
  stream.reason = reason;
  stream.save();


  // Create unique id for history entity
  const entityId = `${contractAddress.toHexString()}-${streamId.toHexString()}-${txHash.toHexString()}`;

  // Create history entity
  let historyEvent = new HistoryEvent(entityId);
  historyEvent.txHash = txHash;
  historyEvent.eventType = streamWasPaused ? "StreamResumed" : "StreamCreated";
  historyEvent.users = [payer.id, payee.id];
  historyEvent.token = token.id;
  historyEvent.stream = stream.id;
  historyEvent.createdTimestamp = timestamp;
  historyEvent.createdBlock = block;

  historyEvent.save();
}
