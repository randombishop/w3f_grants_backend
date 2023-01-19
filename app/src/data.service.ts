import { Injectable } from '@nestjs/common';
import { Octokit } from "@octokit/rest";
import * as Shell from "shelljs" ;
import * as fs from 'fs' ;
import GrantApplicationParser from './parsers/grant_application_parser' ;
import DeliveryParser from './parsers/delivery_parser' ;
import EvaluationParser from './parsers/evaluation_parser' ;

const LIST_FILES = ["AdMeta.md","Afloat.md","AlgoCash.md","Apron_Network.md","ArtZero_InkWhale.md","BCANN.md","Banksy_Finance.md","CESS.md","Calamar.md","Cere_Turnkey_Private_Blockchain_Network.md","Coinversation.md","Crowdloans-FET.md","DICO.md","DKSAP.md","DNFT.md","Dante_Network.md","Datagen_Project.md","DipoleOracle.md","DistributedKeyManagement.md","DotPay.md","DotPulse.md","Doter.md","EverlastingCash.md","FIAT-on-off-ramp.md","Faucet.md","Fennel_Protocol.md","Gafi.md","GenesisDAO.md","Gluon_decentralized_hardware_crypto_wallet_services.md","GreenLemon.md","Idavoll Network.md","Integrating-ISO8583.md","Interstellar-Network.md","InvArch.md","JuniDB.md","KSM-embeddable-tip-or-donate-button.md","Koiverse.md","Libra.md","MAP-Bridge.md","MIXER.md","MIXERv2.md","Maki.md","MangoBOX-Protocol.md","MangoSale_Protocol.md","MeProtocol.md","Meta_Defender.md","NFTStore_Network.md","NFT_Bridge_Protocol_for_NFT_Migration_and_Data_Exchange.md","Nolik.md","NuLink.md","OpenSquare-offchain-voting.md","OpenSquare_paid_qa_protocol.md","ParaSpell.md","ParaSpell_follow-up.md","Parallel.md","Plus-follow-up.md","Plus-social-recovery-wallet.md","Plus.md","PolkaKey.md","PolkaSignIn.md","Polkadart.md","Polkadot-Dart.md","PolkadotSnap.md","Polkadot_Web_UI.md","Polkaholic.md","Polkawatch.md","Primis.md","PrivaDEX_aggregator.md","QRUCIAL_DAO.md","QSTN.md","RainbowDAO Protocol ink Phase 1.md","RareLink.md","RedStone Network.md","Relation-Graph.md","Roloi.md","RubeusKeeper.md","Rubeus_keeper_st2.md","RubyProtocol.md","SEOR-code-less-smart-contract-platform.md","SaaS3.md","Shivarthu.md","Societal.md","Solang_developer_experience_improvements.md","SpiderDAO.md","Standard_Protocol.md","Starry_Network.md","SubDAO-Chrome-Extension.md","SubDAO_Network.md","SubDAO_PolkaSign.md","SubGame_Network.md","SubGame_Network_m2.md","SubIdentity.md","SubsCrypt.md","Subsembly-GRANDPA.md","SydTek.md","TREX_Network.md","Treasureland.md","UMC-Tokenscribe.md","Web3Box.md","Web3Go.md","Whiteflag-on-Fennel.md","XPredictMarket.md","ZK-Snarks tutorial.md","ZeroDAO_Network.md","ZeroPool.md","Zombienet-Explorer.md","Zondax-Support.md","ajuna_network_follow_up.md","anagolay-project-idiyanale-multi-token-community-contributions-for-verified-creators.md","anagolay-project-idiyanale-phase-1.md","application-template-research.md","application-template.md","ares_protocol.md","assemblyscript-scale-codec.md","asylum.md","asylum_follow_up_1.md","bdwallet.md","binary_merkle_tree.md","bit_country.md","bit_country_m2.md","blackprint-js.md","bldg_app.md","bounce-protocol.md","bright_treasury.md","c++polkadot-light-client.md","cScale.md","candle_auction_ink.md","canyon_network.md","centrifuge-gsrpc-v2.md","ces_data_store.md","chainjs.md","chainviz.md","cheersland.md","choko_wallet.md","citadel.md","clover_network.md","coong_wallet.md","cross-chain-wallet.md","crossbow.md","crowdloan_frontend_template.md","cryptolab-staking-reward-collector-front-end.md","curve_amm.md","daos.md","dart-scale-codec.md","decentralized_invoice.md","decentralized_well-being_game_api.md","deeper_network.md","deip.md","delmonicos.md","dora-factory-molochdao-v1-v2.md","dora-factory-multisig.md","dorahacks-quadratic-funding.md","dot_marketplace-Phase3.md","dot_marketplace-phase2.md","dot_marketplace.md","dotmog.md","eightfish.md","epirus_substrate_explorer.md","epirus_substrate_phase_2.md","escrow_pallet.md","evanesco_networks.md","example-project.md","faceless.md","fair_squares.md","faterium.md","fractapp.md","halva_bootstrapping.md","halva_framework.md","hamster.md","helixstreet.md","hex.md","hs-web3.md","hybrid_node_research.md","imbue_network.md","ink-boxes.md","ink-explorer.md","ink-smart-contract-wizard.md","ipfs_utilities.md","iris.md","iris_followup.md","java-client.md","keysafe_network.md","klevoya_fuzzer.md","konomi.md","kylin_network.md","leetcoin.md","liberland.md","lip_payments.md","logion_wallet.md","lunie.md","manta_network.md","massbit_route.md","mobile-game-framework.md","mobile_dapp_connection.md","multisignature_management_tool.md","mybank.md","native-bitcoin-vaults.md","new-order.md","new_bls12_hash_function.md","newomega-m3m4.md","newomega.md","nft_collectibles_wallet.md","nft_explorer.md","nft_product_analytics_suite.md","odyssey_momentum.md","on-chain-cash.md","open-node-framework.md","openbrush-follow-up-2.md","openbrush-follow-up.md","openbrush.md","openrollup-mvp-phase-1.md","pacific_store.md","pallet-drand-client.md","pallet_maci.md","pallet_supersig.md","panic.md","parachain-staking.md","parami-protocol.md","perun_app_channels.md","perun_channels-integration.md","perun_channels.md","pesa_pallet.md","php-rpc-lib.md","php-scale-lib.md","php-substrate-api.md","plip.md","polk-auction.md","polkadex.md","polkadot-contract-wizard.md","polkadot-desktop-app.md","polkadot-js-extension-per-account-auth.md","polkadotjs-ecdsa.md","polkadotjs-hardware.md","polkadotjs_no_code.md","polkaj_android_support.md","polkakeeper.md","polkamusic.md","polkashots.md","polkastarter.md","polkastats.md","polket_toearnfun.md","pontem.md","project_1001.md","project_aurras_mvp_phase_1.md","project_aurras_mvp_phase_2.md","project_bodhi.md","project_silentdata.md","prosopo.md","quadratic-funding.md","quantumLock.md","rb_substrate_client.md","research-feasibility-go-runtime.md","research-feasibiliy-java-host.md","rv-kmir.md","saito-game-protocol-and-engine.md","scale-codec-comparator.md","sensio_network.md","sequester.md","setheum-launchpad-crowdsales-pallet.md","setheum.md","shadows-network.md","signac.md","skyekiwi-protocol.md","skyepass.md","skynet-substrate-integration.md","slonigiraf.md","social_recovery_wallet.md","sol2ink-follow-up.md","sol2ink.md","spacewalk-bridge.md","spartan_poc_consensus_module.md","sr25519_donna.md","stable-asset.md","staking-rewards-collector-front-end.md","stardust.md","starks_network.md","stone-index-on-substrate.md","subalfred.md","subauction.md","subdex.md","subquery.md","subrelay.md","subscript_lang.md","substats.md","substrate-identity-directory.md","substrate-parachain-PoS-template.md","substrate-tutorials.md","substrate_client_java.md","substrate_core_polywrapper.md","substrate_startkit_GUI.md","subvt-telegram-bot.md","subwallet.md","sukhavati_poc_module.md","sunrise-dex.md","sunshine-keybase.md","sup.md","tdot.md","tribal_protocol.md","typechain-polkadot-follow-up.md","typechain-polkadot.md","uke-protocol.md","uke.md","unified_collator_node_deployment.md","universaldot-me.md","universaldot.me.md","upgradeability-by-proxy.md","uplink.md","validated-streams.md","validators_selection.md","vanguard.md","ventur.md","vera_defi.md","verida_network.md","visualize_rust_lifetime.md","walt-id_nft-infra.md","wasm-opt-for-rust.md","wasm_runtimes_fuzzing.md","wasmedge_substrate.md","web3-compatible-api.md","wika_network.md","workflow_testing.md","xbi-format-psp-t3rn.md","xcm-sdk.md","xtokens.md","yatima.md","yiban_chen1.md","yieldscan_phase_2.md","zenlink-cross-chain-dex.md","zenlink-smart-contract.md","zenlink.md","zero-network.md","zk-plonk.md","zk-rollups.md"] ;



@Injectable()
export class DataService {

  private db ;
  private octokit ;

  constructor() {
    this.db = {} ;
    this.octokit = new Octokit() ;
  }

  getHello(): string {
    return 'Hello World!';
  }

  async gitClone(): Promise<object> {
    const tmp_data_folder = process.env.TMP_DATA_DIRECTORY
    await Shell.cd(tmp_data_folder) ;
    await Shell.rm('-rf', 'Grants-Program');
    await Shell.rm('-rf', 'Grant-Milestone-Delivery');
    await Shell.exec('git clone git@github.com:w3f/Grants-Program.git', {silent:true}) ;
    await Shell.exec('git clone git@github.com:w3f/Grant-Milestone-Delivery.git', {silent:true}) ;
    return {
        status: 'ok'
    } ;
  }

  async parseFolderData(folder, excludeFiles, parseFunction): Promise<Array<any>> {
    const ans = [] ;
    await Shell.cd(folder) ;
    const folder_files = fs.readdirSync(folder) ;
    var numFilesProcessed = 0 ;
    var numWarnings = 0 ;
    //const allFiles = 10 ;
    const allFiles = folder_files.length ;
    for (var i=0 ; i<allFiles ; i++) {
        const fileName = folder_files[i] ;
        var ok = (fileName.endsWith('.md') || fileName.endsWith('.MD')) ;
        ok = ok && (!excludeFiles.includes(fileName)) ;
        if (ok) {
            const parse_file = folder + '/' + fileName ;
            const text = fs.readFileSync(parse_file).toString()
            const format = ' --date=iso-strict --pretty=format:\'{%n  "commit": "%H",%n  "author": "%aN <%aE>",%n  "date": "%ad",%n  "message": "%f"%n },%n  \' ' ;
            const log = (await Shell.exec('git log --first-parent master '+format+' "'+fileName+'"', {silent:true})).stdout ;
            const [result, warning] = parseFunction(fileName, text, log) ;
            ans.push(result) ;
            numFilesProcessed++ ;
            if (warning) numWarnings++ ;
        }
    }
    return [ans, numFilesProcessed, numWarnings] ;
  }

  async parseApplications(): Promise<object> {
    const folder = process.env.TMP_DATA_DIRECTORY+'/Grants-Program/applications' ;
    const excludeFiles = ['index.md'] ;
    function parseFunction(fileName, text, log) {
        const parser = new GrantApplicationParser(fileName, text, log) ;
        const result = parser.getResult() ;
        const warning = !(result.pullRequest && result.teamName && result.paymentAddress && result.level && result.amount && result.milestones) ;
        return [result, warning] ;
    }
    const [data, numFilesProcessed, numWarnings] = await this.parseFolderData(folder, excludeFiles, parseFunction) ;
    this.db.applications = data ;
    return {
        numFilesProcessed: numFilesProcessed,
        numWarnings: numWarnings
    }
  }

  async parseDeliveries(): Promise<object> {
    const folder = process.env.TMP_DATA_DIRECTORY+'/Grant-Milestone-Delivery/deliveries' ;
    const excludeFiles = ['.delivery_testing.md', 'milestone-delivery-template.md'] ;
    function parseFunction(fileName, text, log) {
        const parser = new DeliveryParser(fileName, text, log, LIST_FILES) ;
        const result = parser.getResult() ;
        const warning = !(result.fileName && result.milestoneNumber && result.applicationFile) ;
        return [result, warning] ;
    }
    const [data, numFilesProcessed, numWarnings] = await this.parseFolderData(folder, excludeFiles, parseFunction) ;
    this.db.deliveries = data ;
    return {
        numFilesProcessed: numFilesProcessed,
        numWarnings: numWarnings
    }
  }

  async parseEvaluations(): Promise<object> {
    const folder = process.env.TMP_DATA_DIRECTORY+'/Grant-Milestone-Delivery/evaluations' ;
    const excludeFiles = [] ;
    function parseFunction(fileName, text, log) {
        const parser = new EvaluationParser(fileName, text, log, LIST_FILES) ;
        const result = parser.getResult() ;
        const warning = !(true) ;
        return [result, warning] ;
    }
    const [data, numFilesProcessed, numWarnings] = await this.parseFolderData(folder, excludeFiles, parseFunction) ;
    this.db.evaluations = data ;
    return {
        numFilesProcessed: numFilesProcessed,
        numWarnings: numWarnings
    }
  }

  getApplications(): object {
    return this.db.applications ;
  }

  getApplicationFileNames(): Array<string> {
    return this.db.applications.map(x=>x.fileName) ;
  }

}
