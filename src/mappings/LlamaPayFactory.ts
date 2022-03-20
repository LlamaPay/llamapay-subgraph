import { Bytes } from "@graphprotocol/graph-ts";
import { LlamaPayCreated } from "../../generated/templates/LlamaPay/LlamaPayFactory";
import {
  LlamaPayContract,
  LlamaPayFactory
} from "../../generated/schema";
import { LlamaPay } from "../../generated/templates";

const factoryAddress = "0x4dDFc224e5DA184dC458769491cb2F17E37567B7";

export function onLlamaPayCreated(event: LlamaPayCreated): void {
  let factory = LlamaPayFactory.load(factoryAddress);
  if (factory === null) {
    factory = new LlamaPayFactory(factoryAddress);
    factory.count = 0;
    factory.address = Bytes.fromHexString(factoryAddress);
    factory.createdTimestamp = event.block.timestamp;
    factory.createdBlock = event.block.number;
  }

  let contract = new LlamaPayContract(event.params.llamaPay.toHexString());
  
  contract.address = event.params.llamaPay;
  contract.factory = factory.address;
  contract.token = event.params.token;
  contract.createdTimestamp = event.block.timestamp;
  contract.createdBlock = event.block.number;

  contract.save();
  LlamaPay.create(event.params.llamaPay);
  factory.count += 1;
  factory.save();
}
