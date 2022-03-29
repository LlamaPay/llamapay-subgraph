import { Bytes } from "@graphprotocol/graph-ts";
import { LlamaPayCreated } from "../../generated/templates/LlamaPay/LlamaPayFactory";
import {
  LlamaPayContract,
  LlamaPayFactory,
  Token
} from "../../generated/schema";
import {LlamaPay} from "../../generated/templates"
import {ERC20} from "../../generated/LlamaPayFactory/ERC20"


// Address for Factory
const factoryAddress = "0x068d6B8aD65679a741D7086c0cb96f8530B38494";

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

  let erc20 = ERC20.bind(event.params.token);
  let token = new Token(event.params.token.toHexString());
  token.address = event.params.token;
  token.symbol = (erc20.try_symbol()).value;
  token.name = (erc20.try_name()).value;
  token.decimals = (erc20.try_decimals()).value;

  // Create new contract node
  let contract = new LlamaPayContract(event.params.llamaPay.toHexString());
  
  contract.address = event.params.llamaPay;
  contract.factory = factory.id;
  contract.token = token.id;
  contract.createdTimestamp = event.block.timestamp;
  contract.createdBlock = event.block.number;

  token.contract = contract.id;

  // Update mapping with new contract address
  LlamaPay.create(event.params.llamaPay);

  token.save();
  contract.save();
  factory.count += 1;
  factory.save();
}
