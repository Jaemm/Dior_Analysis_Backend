import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ImagesService {
    constructor(private database: DatabaseService) {}

    async getAnalysisImage(batch_id: number) {
        let ressObj;
        return ressObj;
    }

    async getImage(hash: string) {
        const sys_url = await this.database.executeQuery(
            `
            SELECT sys_url
            FROM measurements
            WHERE 
                hash = '${hash}'
            `,
        );

        return sys_url;
    }
}

