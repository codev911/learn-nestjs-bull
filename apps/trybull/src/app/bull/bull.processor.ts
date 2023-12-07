import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ethers } from 'ethers';
import axios from 'axios';

@Processor('blockchain')
export class BullProcessor {
    private readonly logger = new Logger(BullProcessor.name);

    private abiAirdrop: any;
    private abiNft: any;
    private provider: any;
    private signer: any;
    private contractAirdrop: any;
    private contractNft: any;

    constructor() {
        this.abiAirdrop = require('../../assets/abi-airdrop.json');
        this.abiNft = require('../../assets/abi-nft.json')
        this.provider = new ethers.providers.JsonRpcProvider(process.env.BC_RPC);
        this.signer = new ethers.Wallet(process.env.BC_PRIVATE_KEY).connect(this.provider);
        this.contractAirdrop = new ethers.Contract(process.env.BC_AIRDROP_CONTRACT,this.abiAirdrop,this.signer);
        this.contractNft = new ethers.Contract(process.env.BC_NFT_CONTRACT,this.abiNft,this.signer);
    }

    @Process('forwardTransaction')
    async handleFaucet(job: Job) {
        if (job.data.type === 'faucet') {
            try {
                this.logger.debug('Start faucet...');
                this.logger.debug('processing this data', job.data);
    
                const gasPrice = await this.getPriceGas();
    
                const wallets = job.data.data.wallets;
                const amount = job.data.data.amount;
                const amountSend = job.data.data.amount * wallets.length;
                const bnAmountSend = ethers.utils.parseEther(amountSend.toString());
                const bnAmount = ethers.utils.parseEther(amount.toString());
    
                const tx = await this.contractAirdrop.airdrop(
                    bnAmount,
                    wallets,
                    {
                        value: bnAmountSend,
                        maxFeePerGas: gasPrice.maxFee,
                        maxPriorityFeePerGas: gasPrice.maxPriorityFee,
                    }
                )
                const receipt = await tx.wait();
    
                this.logger.debug('txhash', receipt.transactionHash);
                this.logger.debug('faucet completed');
            } catch (error) {
                this.logger.error(error);
            }
        }

        if (job.data.type === 'multicall') {
            try {
                this.logger.debug('Start multicall...');
                this.logger.debug('processing this data', job.data);
    
                const data = job.data.data;
                const multicallData = [];
    
                data.forEach(async res => {
                    const populate = await this.contractNft.populateTransaction.safeTransferFrom(
                        res.from,
                        res.to,
                        res.id,
                        res.amount,
                        '0x'
                    );
    
                    multicallData.push(populate.data);
                })
    
                const gasPrice = await this.getPriceGas();
    
                const tx = await this.contractNft.multicall(
                    multicallData,
                    {
                        maxFeePerGas: gasPrice.maxFee,
                        maxPriorityFeePerGas: gasPrice.maxPriorityFee,
                    }
                )
                const receipt = await tx.wait();
    
                this.logger.debug('txhash', receipt.transactionHash);
                this.logger.debug('multicall completed');
            } catch (error) {
                this.logger.error(error);
            }
        }
    }

    async getPriceGas() {
        const gasPriceAPI = 'https://gasstation.polygon.technology/v2';
        const response = await axios.get(gasPriceAPI);
    
        const gasPriceData = await response.data;
        const gasPriceInGwei = gasPriceData?.fast;

        return {
            maxFee: ethers.utils.parseUnits(gasPriceInGwei.maxFee.toString(), 'gwei'),
            maxPriorityFee: ethers.utils.parseUnits(gasPriceInGwei.maxPriorityFee.toString(), 'gwei')
        };
    }
}