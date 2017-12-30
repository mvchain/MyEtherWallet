import React from 'react';
import { connect } from 'react-redux';
import { AppState } from 'reducers';
import translate from 'translations';
import { IWallet } from 'libs/wallet';
import { Identicon, QRCode } from 'components/ui';
import { getUnit, getDecimal } from 'selectors/transaction/meta';
import {
  getCurrentTo,
  getCurrentValue,
  ICurrentTo,
  ICurrentValue
} from 'selectors/transaction/current';
import BN from 'bn.js';
import { NetworkConfig } from 'config/data';
import { validNumber, validDecimal } from 'libs/validators';
import { getGasLimit } from 'selectors/transaction';
import { AmountField, GasField } from 'components';
import { SetGasLimitFieldAction } from 'actions/transaction/actionTypes/fields';
import { buildEIP681EtherRequest, buildEIP681TokenRequest } from 'libs/values';
import { getNetworkConfig, getSelectedTokenContractAddress } from 'selectors/config';
import './RequestPayment.scss';

interface OwnProps {
  wallet: AppState['wallet']['inst'];
}

interface StateProps {
  unit: string;
  currentTo: ICurrentTo;
  currentValue: ICurrentValue;
  gasLimit: SetGasLimitFieldAction['payload'];
  networkConfig: NetworkConfig | undefined;
  decimal: number;
  tokenContractAddress: string;
}

type Props = OwnProps & StateProps;

interface State {
  recipientAddress: string;
}

const isValidAmount = decimal => amount => validNumber(+amount) && validDecimal(amount, decimal);

class RequestPayment extends React.Component<Props, State> {
  public state = {
    recipientAddress: ''
  };

  public componentDidMount() {
    if (this.props.wallet) {
      this.setWalletAsyncState(this.props.wallet);
    }
  }

  public componentWillReceiveProps(nextProps: Props) {
    if (nextProps.wallet && this.props.wallet !== nextProps.wallet) {
      this.setWalletAsyncState(nextProps.wallet);
    }
  }

  public render() {
    const { recipientAddress } = this.state;
    const {
      tokenContractAddress,
      gasLimit,
      currentValue,
      networkConfig,
      unit,
      decimal
    } = this.props;
    const chainId = networkConfig ? networkConfig.chainId : undefined;

    const eip681String = this.generateEIP681String(
      recipientAddress,
      tokenContractAddress,
      currentValue,
      gasLimit,
      unit,
      decimal,
      chainId
    );

    return (
      <div className="RequestPayment">
        <div className="Tab-content-pane">
          <div className="row form-group">
            <div className="col-xs-11">
              <label>{translate('Recipient Address')}</label>
              <input className="form-control" disabled={true} value={recipientAddress} />
            </div>
            <div className="col-xs-1" style={{ padding: 0 }}>
              <Identicon address={recipientAddress} />
            </div>
          </div>

          <div className="row form-group">
            <div className="col-xs-11">
              <AmountField
                hasUnitDropdown={true}
                showAllTokens={true}
                customValidator={isValidAmount(decimal)}
              />
            </div>
          </div>

          <div className="row form-group">
            <div className="col-xs-11">
              <GasField />
            </div>
          </div>

          {!!eip681String.length && (
            <div className="row form-group">
              <div className="col-xs-6">
                <label>{translate('Payment QR & Code')}</label>
                <div className="RequestPayment-qr well well-lg">
                  <QRCode data={eip681String} />
                </div>
              </div>
              <div className="col-xs-6 RequestPayment-codeContainer">
                <textarea
                  className="RequestPayment-codeBox form-control"
                  value={eip681String}
                  disabled={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  private async setWalletAsyncState(wallet: IWallet) {
    const recipientAddress = await wallet.getAddressString();
    this.setState({ recipientAddress });
  }

  private generateEIP681String(
    recipientAddress: string,
    tokenContractAddress: string,
    currentValue,
    gasLimit: { raw: string; value: BN | null },
    unit: string,
    decimal: number,
    chainId?: number
  ) {
    if (!isValidAmount(decimal)(currentValue.raw) || !chainId) {
      return '';
    }

    if (unit === 'ether') {
      return buildEIP681EtherRequest(recipientAddress, chainId, currentValue);
    } else {
      return buildEIP681TokenRequest(
        recipientAddress,
        tokenContractAddress,
        chainId,
        currentValue,
        decimal,
        gasLimit
      );
    }
  }
}

function mapStateToProps(state: AppState): StateProps {
  return {
    unit: getUnit(state),
    currentTo: getCurrentTo(state),
    currentValue: getCurrentValue(state),
    gasLimit: getGasLimit(state),
    networkConfig: getNetworkConfig(state),
    decimal: getDecimal(state),
    tokenContractAddress: getSelectedTokenContractAddress(state)
  };
}

export default connect(mapStateToProps)(RequestPayment);