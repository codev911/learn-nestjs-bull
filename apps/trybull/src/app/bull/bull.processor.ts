import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ethers } from 'ethers';
import axios from 'axios';

@Processor('blockchain')
export class BullProcessor {
    private readonly logger = new Logger(BullProcessor.name);

    private abi: any = require('../../assets/abi-airdrop.json')
    private provider: any = new ethers.providers.JsonRpcProvider(
        process.env.BC_RPC,
    );
    private signer: any = new ethers.Wallet(
        process.env.BC_PRIVATE_KEY
    ).connect(this.provider);
    private contract: any = new ethers.Contract(
        process.env.BC_AIRDROP_CONTRACT,
        this.abi,
        this.signer
    )

    @Process('faucet')
    async handleTranscode(job: Job) {
        try {
            this.logger.debug('Start faucet...');
            const gasPrice = await this.getPriceGas();

            const wallets = job.data.wallets;
            const amount = job.data.amount;
            const amountSend = job.data.amount * wallets.length;
            const bnAmountSend = ethers.utils.parseEther(amountSend.toString());
            const bnAmount = ethers.utils.parseEther(amount.toString());

            const tx = await this.contract.airdrop(
                bnAmount,
                wallets,
                {
                    value: bnAmountSend,
                    maxFeePerGas: gasPrice.maxFee,
                    maxPriorityFeePerGas: gasPrice.maxPriorityFee,
                }
            )
            const receipt = await tx.wait();

            this.logger.debug(receipt);
            this.logger.debug('faucet completed');
        } catch (error) {
            this.logger.error(error);
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