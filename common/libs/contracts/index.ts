import AbiFunction from './ABIFunction';
import { ContractOutputMappings } from './types';

const ABIFUNC_METHOD_NAMES = ['encodeInput', 'decodeInput', 'decodeOutput', 'call'];

enum ABIMethodTypes {
  FUNC = 'function'
}

export type TContract = typeof Contract;

export default class Contract {
  /*
  public static setConfigForTx = (
    contract: Contract,
    { wallet, nodeLib, chainId, gasPrice }: ISetConfigForTx
  ): Contract =>
    contract
      .setWallet(wallet)
      .setNode(nodeLib)
      .setChainId(chainId)
      .setGasPrice(gasPrice);
*/
  public static getFunctions = (contract: Contract) =>
    Object.getOwnPropertyNames(contract).reduce((accu, currContractMethodName) => {
      const currContractMethod = contract[currContractMethodName];
      const methodNames = Object.getOwnPropertyNames(currContractMethod);

      const isFunc = ABIFUNC_METHOD_NAMES.reduce(
        (isAbiFunc, currAbiFuncMethodName) =>
          isAbiFunc && methodNames.includes(currAbiFuncMethodName),
        true
      );
      return isFunc ? { ...accu, [currContractMethodName]: currContractMethod } : accu;
    }, {});

  public abi;
  /*
  private wallet: IFullWallet;
  private gasPrice: Wei;
  private chainId: number;
  private node: RPCNode;
*/
  constructor(abi, outputMappings: ContractOutputMappings = {}) {
    this.assignABIFuncs(abi, outputMappings);
  }
  /*
  public at = (addr: string) => {
    this.address = addr;
    return this;
  };

  public setWallet = (w: IFullWallet) => {
    this.wallet = w;
    return this;
  };

  public setGasPrice = (gasPrice: Wei) => {
    this.gasPrice = gasPrice;
    return this;
  };

  public setChainId = (chainId: number) => {
    this.chainId = chainId;
    return this;
  };
  public setNode = (node: RPCNode) => {
    //TODO: caching
    this.node = node;
    return this;
  };
*/
  private assignABIFuncs = (abi, outputMappings: ContractOutputMappings) => {
    abi.forEach(currentABIMethod => {
      const { name, type } = currentABIMethod;
      if (type === ABIMethodTypes.FUNC) {
        //only grab the functions we need
        const {
          encodeInput,
          decodeInput,
          decodeOutput,
          constant,
          outputs,
          inputs
        } = new AbiFunction(currentABIMethod, outputMappings[name]);

        const funcToAssign = {
          [name]: {
            encodeInput,
            decodeInput,
            decodeOutput,
            constant,
            outputs,
            inputs
          }
        };
        Object.assign(this, funcToAssign);
      }
    });
  };
  /*
  private applyTrapForCall = (target, _, argumentsList) => {
    return target(
      //TODO: pass object instead
      ...(argumentsList.length > 0 ? argumentsList : [null]),
      this.node,
      this.address
    );
  };

  private applyTrapForSend = (
    target: (sendParams: ISendParams) => void,
    _,
    [userSendParams]: [IUserSendParams]
  ) => {
    return target({
      chainId: this.chainId,
      gasPrice: this.gasPrice,
      to: this.address,
      nodeLib: this.node,
      wallet: this.wallet,
      ...userSendParams
    });
  };*/
}
