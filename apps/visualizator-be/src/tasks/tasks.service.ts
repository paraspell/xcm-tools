import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/message.entity';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';

const waitRandomSeconds = (min: number, max: number) => {
  const milliseconds = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  console.log(`Waiting for ${milliseconds} milliseconds...`);
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

@Injectable()
export class TasksService {
  private readonly lastPageFile = './lastPage.txt';
  private readonly url = 'https://polkadot.subscan.io/xcm_transfer';
  private aferId: string | undefined;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  onApplicationBootstrap() {
    //this.handleCron();
  }

  @Cron('0 16 * * *')
  async handleCron() {
    console.log('Cron job started at 4 PM');
    const lastPage = await this.getLastPageCrawled();
    console.log(`Starting task from page ${lastPage}`);
    await this.runTask(lastPage);
  }

  private async runTask(startPage: number) {
    console.log(`Fetching total entries to calculate total pages...`);
    const entriesPerPage = 25;
    const totalEntries = await this.fetchTotalEntries();
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    console.log(`Total pages calculated: ${totalPages}`);

    console.log(`Starting task from page ${startPage}`);
    for (let page = startPage; page <= totalPages; page++) {
      if (page > 1000) {
        break;
      }
      console.log(`Fetching data for page ${page}`);
      const data = await this.fetchPage(page, this.aferId);
      if (data) {
        console.log(`Data fetched for page ${page}, saving data...`);
        console.log(data[data.length - 1]);
        this.aferId = data[data.length - 1].unique_id;
        await this.saveData(data);
        console.log(
          `Data saved for page ${page}, updating last crawled page...`,
        );
        await this.saveLastPageCrawled(page);
      }
      await waitRandomSeconds(1, 5);
    }
  }

  private async saveLastPageCrawled(pageNumber: number): Promise<void> {
    console.log(`Saving last crawled page number: ${pageNumber}`);
    //fs.writeFileSync(this.lastPageFile, pageNumber.toString(), 'utf8');
  }

  private async getLastPageCrawled(): Promise<number> {
    try {
      if (fs.existsSync(this.lastPageFile)) {
        //const lastPage = fs.readFileSync(this.lastPageFile, 'utf8');
        return 1;
      }
    } catch (error) {
      console.error('Error reading the last page file:', error);
    }
    return 1;
  }

  private async fetchTotalEntries(): Promise<number> {
    try {
      const response = await axios.get(this.url, {
        headers: { 'User-Agent': '_' },
      });
      const htmlContent = response.data;
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      // Use the specified selector to find the element containing the total entries
      const element = document.querySelector('#__NEXT_DATA__');

      if (element) {
        const jsonData = JSON.parse(element.textContent);
        const totalEntries = jsonData.props.pageProps.data.count;
        console.log(`Total entries found: ${totalEntries}`);
        return totalEntries;
      } else {
        console.log('Element not found. No data to fetch.');
      }
    } catch (error) {
      console.log('Error fetching the total number of entries:', error);
    }
    return 0;
  }

  private async fetchPage(
    pageNumber: number,
    afterId?: string,
  ): Promise<any[]> {
    let url = `${this.url}?page=${pageNumber}`;
    if (pageNumber >= 1 && afterId) {
      url = `${this.url}?page=${pageNumber}&afterId=${afterId}`;
    }
    try {
      console.log(`Fetching URL: ${url}`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': '_' },
      });
      const htmlContent = response.data;
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      const element = document.querySelector('#__NEXT_DATA__');
      if (element) {
        const jsonData = JSON.parse(element.textContent);
        return jsonData.props.pageProps.data.list;
      } else {
        console.log('Element not found. No data to fetch.');
      }
    } catch (error) {
      console.error(`Error fetching page ${pageNumber}:`);
    }
    return null;
  }

  private async saveData(data: any[]) {
    for (const item of data) {
      console.log(
        `Checking existence in DB for message hash: ${item.message_hash}`,
      );
      const exists = await this.messageRepository.findOne({
        where: { message_hash: item.message_hash },
      });
      if (!exists) {
        console.log(
          `Message hash ${item.message_hash} not found, saving new entry...`,
        );
        const message = this.messageRepository.create(item);
        await this.messageRepository.save(message);
        console.log(`Message saved: ${item.message_hash}`);
      } else {
        console.log(
          `Message hash ${item.message_hash} already exists, skipping save.`,
        );
      }
    }
  }
}
