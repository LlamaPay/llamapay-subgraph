import { LlamaPayContract, LlamaPayFactory, Token } from "../../generated/schema";
import { LlamaPayCreated } from "../../generated/templates/LlamaPay/LlamaPayFactory";
import {ERC20} from "../../generated/LlamaPayFactory/ERC20"
import {LlamaPay} from "../../generated/templates"

export function onLlamaPayCreated(event: LlamaPayCreated): void {
  
  const factoryAddress = event.address;
  const tokenAddress = event.params.token;
  const llamaPayAddress = event.params.llamaPay;
  const block = event.block.number;
  const timestamp = event.block.timestamp;

  // Load Factory
  let factory = LlamaPayFactory.load(factoryAddress.toHexString());

  // Create new Factory entity with info if null
  if (factory === null) {
    factory = new LlamaPayFactory(factoryAddress.toHexString());
    factory.address = factoryAddress;
    factory.createdTimestamp = timestamp;
    factory.createdBlock = block;
  }

  // Create and fill new Token entity
  const erc20 = ERC20.bind(tokenAddress);
  let token = new Token(tokenAddress.toHexString());
  token.address = tokenAddress;
  token.symbol = (erc20.try_symbol()).value;
  token.name = (erc20.try_name()).value;
  token.decimals = (erc20.try_decimals()).value;
  token.createdTimestamp = timestamp;
  token.createdBlock = block;

  // Create new contract entity and fill with info
  let contract = new LlamaPayContract(llamaPayAddress.toHexString());
  contract.address = llamaPayAddress;
  contract.factory = factory.id;
  contract.token = token.id;
  contract.createdTimestamp = timestamp;
  contract.createdBlock = block;

  // Map contract to Token
  token.contract = contract.id;

  // Start tracking the llamapay contract
  LlamaPay.create(llamaPayAddress);

  // Add 1 to contracts counted by factory
  factory.count += 1;

  //Savooooor
  factory.save();
  token.save();
  contract.save();
}