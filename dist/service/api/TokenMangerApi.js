"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenMangerApi = void 0;
const ajv_1 = __importDefault(require("ajv"));
const get_1 = __importDefault(require("lodash/get"));
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const remove_1 = __importDefault(require("lodash/remove"));
const ethers_1 = require("ethers");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const tool_1 = require("../tool");
const vo_1 = require("../vo");
const BasicException_1 = require("../../BasicException");
const tokens_json_1 = __importDefault(require("../../config/tokens.json"));
const PoolGql_1 = require("./gql/PoolGql");
const BaseApi_1 = require("./BaseApi");
let TokenMangerApi = class TokenMangerApi {
    constructor() {
        this.defaultTokenListUrl = 'https://raw.githubusercontent.com/magma-protocol/tokenList/main/magma.json';
        this.baseApi = BaseApi_1.BASE_API;
    }
    async batchGetTokens(addresses) {
        const tokenAddressMap = (0, groupBy_1.default)(await this.getTokenByTokenList(), it => it.address);
        const tokens = await this.getTokenByContract(addresses);
        const tokenMap = {};
        addresses.forEach((it, index) => {
            const tokenListToken = tokenAddressMap[it.toLowerCase()] || [];
            tokenMap[it] = tokenListToken.length > 0 ? tokenListToken[0] : tokens[index];
        });
        return tokenMap;
    }
    async tokenPrice(...tokens) {
        const addresses = tokens.map(it => it.erc20Address().toLowerCase());
        const { bundles, tokens: tokenPrices, } = await this.baseApi.exchangeV3Graph(PoolGql_1.TokenPriceGQL, { addresses });
        const _groupBy = (0, groupBy_1.default)(tokenPrices, it => it.id.toLowerCase());
        return tokens.map((token) => {
            const mntPrice = (0, get_1.default)(bundles, '0.ethPriceUSD', '0');
            const groupByElementElement = _groupBy[token.erc20Address().toLowerCase()][0];
            if (groupByElementElement) {
                const price = groupByElementElement.derivedETH;
                const priceUSD = new bignumber_js_1.default(price).times(mntPrice).toFixed();
                const priceMNT = new bignumber_js_1.default(price).toFixed();
                return new vo_1.TokenPrice(token, priceUSD, priceMNT);
            }
            else {
                return new vo_1.TokenPrice(token, '0', '0');
            }
        });
    }
    async tokenList(url = '') {
        if (url === '') {
            const storageTokenListInfos = this.storageTokenListUrls();
            const tokenListInfos = [];
            for (const info of storageTokenListInfos) {
                const urls = this.uriToHttp(info.url);
                try {
                    const tokenList = await this.searchTokenList(urls);
                    const tokenListInfo = this.mapToTokenList(info, tokenList, true);
                    tokenListInfos.push(tokenListInfo);
                }
                catch (e) {
                    tool_1.Trace.debug('showList error ignore', e);
                }
            }
            return tokenListInfos;
        }
        else {
            const urls = this.uriToHttp(url);
            if (urls.length === 0)
                throw new BasicException_1.BasicException(`Unrecognized list URL protocol.`);
            const storageTokenListInfos = this.storageTokenListUrls();
            const tokenList = await this.searchTokenList(urls);
            const storageTokenListInfo = storageTokenListInfos.find(it => it.url === url);
            return [
                this.mapToTokenList({
                    url,
                    enable: (0, get_1.default)(storageTokenListInfo, 'enable', false),
                }, tokenList, !!storageTokenListInfo),
            ];
        }
    }
    async tokenSelectList(account, searchStr = '') {
        const search = searchStr.toLowerCase();
        let storageToken = this.storageToken();
        if (search !== '') {
            storageToken = storageToken.filter((it) => {
                return it.address.toLowerCase().includes(search) || it.symbol.toLowerCase().includes(search) || it.name.toLowerCase().includes(search);
            });
        }
        let balance = {};
        if (account !== '') {
            balance = await this.baseApi.address().readonlyConnectInfo().erc20().batchGetBalance(account, storageToken.map(it => it.address));
        }
        const mapToTokenManager = (token, tokenBalances) => {
            const tokenSelectInfo = new vo_1.TokenSelectInfo();
            tokenSelectInfo.token = token;
            tokenSelectInfo.balance = tokenBalances[token.address]?.amount ?? '0';
            return tokenSelectInfo;
        };
        if (search === '') {
            return {
                searchTokens: [],
                customTokens: storageToken.map(it => mapToTokenManager(it, balance)),
            };
        }
        else {
            const tokenManager = await this.tokenManager(searchStr);
            return {
                searchTokens: tokenManager.searchTokens,
                customTokens: storageToken.map(it => mapToTokenManager(it, balance)),
            };
        }
    }
    async getTokenByTokenList() {
        try {
            return Array.from(await this.tokenList())
                .flatMap(it => it.tokenList.tokens.map(it => tool_1.Token.fromSerialized(it)))
                .filter(it => it.chainId === this.baseApi.address().chainId);
        }
        catch (e) {
            tool_1.Trace.error('getTokenByTokenList error ignore', e);
            return [];
        }
    }
    async getTokenByContract(addresses) {
        try {
            const addressInfo = this.baseApi.address();
            const tokenInfos = await addressInfo.readonlyConnectInfo().erc20().batchGetTokenInfo(...addresses);
            return tokenInfos
                .filter(it => !(0, tool_1.isNullOrBlank)(it.name) && !(0, tool_1.isNullOrBlank)(it.symbol) && it.decimals > 0)
                .map((it) => {
                return new tool_1.Token(addressInfo.chainId, it.address, it.decimals, it.symbol, it.name, `https://agni.finance/static/${it.symbol}.png`);
            });
        }
        catch (e) {
            tool_1.Trace.error('getTokenByContract error ignore', e);
            return [];
        }
    }
    async tokenManager(searchStr = '') {
        const search = searchStr.toLowerCase();
        const storageToken = this.storageToken();
        const mapToTokenManager = (token) => {
            const tokenManagerInfo = new vo_1.TokenManagerInfo();
            tokenManagerInfo.token = token;
            tokenManagerInfo.remove = () => {
                this.storageTokenRemove(tokenManagerInfo.token);
            };
            return tokenManagerInfo;
        };
        if (search === '') {
            return {
                searchTokens: [],
                customTokens: storageToken.map(it => mapToTokenManager(it)),
            };
        }
        else {
            const searchTokens = [];
            const tokensByTokenList = Array.from(await this.getTokenByTokenList())
                .filter((it) => {
                return it.address.toLowerCase().includes(search) || it.symbol.toLowerCase().includes(search) || it.name.toLowerCase().includes(search);
            })
                .map(it => this.mapToTokenAdd(it, storageToken));
            searchTokens.push(...tokensByTokenList);
            if ((0, ethers_1.isAddress)(search)) {
                const searchRpcTokens = (await this.getTokenByContract([search]))
                    .map(it => this.mapToTokenAdd(it, storageToken));
                searchTokens.push(...searchRpcTokens);
            }
            const searchResult = [];
            // searchTokens 去重
            const searchTokensSet = new Set();
            for (const searchToken of searchTokens) {
                if (!searchTokensSet.has(searchToken.token.address)) {
                    searchResult.push(searchToken);
                    searchTokensSet.add(searchToken.token.address);
                }
            }
            return {
                searchTokens: searchResult,
                customTokens: storageToken.filter((it) => {
                    return it.address.toLowerCase().includes(search) || it.symbol.toLowerCase().includes(search) || it.name.toLowerCase().includes(search);
                }).map(it => mapToTokenManager(it)),
            };
        }
    }
    systemTokens() {
        return tokens_json_1.default.filter(t => t.chainId === this.baseApi.address().chainId)
            .map((it) => {
            return new tool_1.Token(this.baseApi.address().chainId, it.address, it.decimals, it.symbol, it.name, it.logoURI);
        });
    }
    tradeTokens() {
        const addressInfo = this.baseApi.address();
        const systemTokens = this.systemTokens();
        return systemTokens.filter(it => addressInfo.baseTradeToken.find(add => (0, tool_1.eqAddress)(it.address, add)));
    }
    WNATIVE() {
        const addressInfo = this.baseApi.address();
        const systemTokens = this.systemTokens();
        return systemTokens.find(it => (0, tool_1.eqAddress)(it.address, addressInfo.WMNT));
    }
    USDT() {
        const addressInfo = this.baseApi.address();
        const systemTokens = this.systemTokens();
        return systemTokens.find(it => (0, tool_1.eqAddress)(it.address, addressInfo.USDT));
    }
    NATIVE() {
        const systemTokens = this.systemTokens();
        return systemTokens.find(it => (0, tool_1.eqAddress)(it.address, vo_1.ETH_ADDRESS));
    }
    async searchTokenList(urls) {
        for (let i = 0; i < urls.length; i++) {
            const isLast = i === urls.length - 1;
            let json;
            try {
                json = await this.baseApi.request(urls[i], 'get', {}, {});
            }
            catch (e) {
                if (isLast)
                    throw new Error(`Failed to download list ${urls[i]}`);
                continue;
            }
            if (json.tokens) {
                (0, remove_1.default)(json.tokens, (token) => {
                    return token.symbol ? token.symbol.length === 0 : true;
                });
            }
            const tokenListValidator = new ajv_1.default({ allErrors: true }).compile(vo_1.AgniTokenListSchema);
            if (!tokenListValidator(json)) {
                const validationErrors = tokenListValidator.errors?.reduce((memo, error) => {
                    const add = `${error.dataPath} ${error.message ?? ''}`;
                    return memo.length > 0 ? `${memo}; ${add}` : `${add}`;
                }, '') ?? 'unknown error';
                if (isLast)
                    throw new Error(`Token list failed validation: ${validationErrors}`);
                continue;
            }
            return json;
        }
        throw new Error('Unrecognized list URL protocol.');
    }
    mapToTokenAdd(token, storageToken) {
        const tokenManagerAddInfo = new vo_1.TokenManagerAddInfo();
        tokenManagerAddInfo.active = !!storageToken.find(it => (0, tool_1.eqAddress)(it.address, token.address));
        tokenManagerAddInfo.token = token;
        tokenManagerAddInfo.import = () => {
            tokenManagerAddInfo.active = true;
            this.storageTokenAdd(tokenManagerAddInfo.token);
        };
        return tokenManagerAddInfo;
    }
    mapToTokenList(info, tokenList, showRemove) {
        const tokenListInfo = new vo_1.TokenListInfo();
        tokenListInfo.storageTokenListInfo = info;
        tokenListInfo.tokenList = tokenList;
        tokenListInfo.showRemove = showRemove;
        tokenListInfo.remove = () => {
            this.storageTokenListUrlsRemove(tokenListInfo.storageTokenListInfo);
        };
        tokenListInfo.updateEnable = (bool) => {
            tokenListInfo.storageTokenListInfo.enable = bool;
            this.storageTokenListUrlsUpdate(tokenListInfo.storageTokenListInfo);
        };
        return tokenListInfo;
    }
    storageToken() {
        let tokens = this.baseApi.address().storage.getArray(tool_1.STORAGE_KEY_TOKENS);
        if (!tokens) {
            tokens = this.systemTokens();
            this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKENS, tokens);
        }
        return tokens.map(it => new tool_1.Token(it.chainId, it.address, it.decimals, it.symbol, it.name, it.logoURI));
    }
    storageTokenAdd(token) {
        const tokens = this.storageToken();
        if (tokens.find(it => (0, tool_1.eqAddress)(it.address, token.address)))
            return;
        tokens.push(token);
        this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKENS, tokens);
    }
    storageTokenRemove(token) {
        const tokens = this.storageToken().filter(it => !(0, tool_1.eqAddress)(it.address, token.address));
        this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKENS, tokens);
    }
    storageTokenListUrls() {
        let storageTokenListInfos = this.baseApi.address().storage.getArray(tool_1.STORAGE_KEY_TOKEN_LIST);
        if (!storageTokenListInfos) {
            storageTokenListInfos = [{
                    url: this.defaultTokenListUrl,
                    enable: true,
                }];
            this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKEN_LIST, storageTokenListInfos);
        }
        return storageTokenListInfos;
    }
    storageTokenListUrlsAdd(storageTokenListInfo) {
        const storageTokenListInfos = this.storageTokenListUrls();
        if (storageTokenListInfos.find(it => it.url === storageTokenListInfo.url))
            return;
        storageTokenListInfos.push(storageTokenListInfo);
        this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKEN_LIST, storageTokenListInfos);
    }
    storageTokenListUrlsUpdate(storageTokenListInfo) {
        const storageTokenListInfos = this.storageTokenListUrls();
        const find = storageTokenListInfos.find(it => it.url === storageTokenListInfo.url);
        if (!find) {
            this.storageTokenListUrlsAdd(storageTokenListInfo);
        }
        else {
            find.enable = storageTokenListInfo.enable;
            this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKEN_LIST, storageTokenListInfos);
        }
    }
    storageTokenListUrlsRemove(storageTokenListInfo) {
        const strings = this.storageTokenListUrls().filter(it => it.url !== storageTokenListInfo.url);
        this.baseApi.address().storage.setJson(tool_1.STORAGE_KEY_TOKEN_LIST, strings);
    }
    uriToHttp(uri) {
        const protocol = uri.split(':')[0].toLowerCase();
        switch (protocol) {
            case 'https':
                return [uri];
            case 'http':
                return [`https${uri.substring(4)}`, uri];
            case 'ipfs': {
                const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
                return [`https://cloudflare-ipfs.com/ipfs/${hash}/`, `https://ipfs.io/ipfs/${hash}/`];
            }
            case 'ipns': {
                const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
                return [`https://cloudflare-ipfs.com/ipns/${name}/`, `https://ipfs.io/ipns/${name}/`];
            }
            default:
                return [];
        }
    }
};
exports.TokenMangerApi = TokenMangerApi;
exports.TokenMangerApi = TokenMangerApi = __decorate([
    (0, tool_1.CacheKey)('TokenMangerApi'),
    __metadata("design:paramtypes", [])
], TokenMangerApi);
