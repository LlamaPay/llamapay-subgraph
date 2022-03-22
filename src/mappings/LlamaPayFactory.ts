import { Bytes } from "@graphprotocol/graph-ts";
import { LlamaPayCreated } from "../../generated/templates/LlamaPay/LlamaPayFactory";
import {
  LlamaPayContract,
  LlamaPayFactory
} from "../../generated/schema";

// Address for Factory
const factoryAddress = "0xF7410203fe4B7D8595DA5211b52e5Dde405ea301";

export function onLlamaPayCreated(event: LlamaPayCreated): void {
  let factory = LlamaPayFactory.load(factoryAddress);
  // If factory node doesn't exist then create one 
  if (factory === null) {
    factory = new LlamaPayFactory(factoryAddress);
    factory.count = 0;
    factory.address = Bytes.fromHexString(factoryAddress);
    factory.createdTimestamp = event.block.timestamp;
    factory.createdBlock = event.block.number;
  }

  // Create new contract node
  let contract = new LlamaPayContract(event.params.llamaPay.toHexString());
  
  contract.address = event.params.llamaPay;
  contract.factory = factory.id;
  contract.token = event.params.token;
  contract.createdTimestamp = event.block.timestamp;
  contract.createdBlock = event.block.number;

  contract.save();
  factory.count += 1;
  factory.save();
}
