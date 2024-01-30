import {CacheKey} from "../tool";
import {BaseAbi} from "./BaseAbi";
import type {ConnectInfo} from "../../ConnectInfo";
import {MixedRouteQuoterV1} from "../../abi";

@CacheKey('MixedRouteQuoterV1Contract')
export class MixedRouteQuoterV1Contract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.mixedRouteQuoterV1 as string, MixedRouteQuoterV1)
  }
}
