import { FastifyInstance } from "fastify";
import {fastifyMultipart} from '@fastify/multipart'
import path from 'node:path'
import { randomUUID } from "node:crypto";
import fs from 'node:fs'
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";


const pump = promisify(pipeline)
export async function uploadVideoRoute(app: FastifyInstance){
    
    app.register(fastifyMultipart,{
        limits:{
            fileSize: 1_048_576 *25, //limite do video 25mb
        }
    })
    app.post('/videos',  async (request, reply)=>{  
        const data = await request.file()

        if(!data){
            return reply.status(400).send({error: 'Missing file input'}) 
        
        }
        const extension = path.extname(data.filename)
            if(extension != '.mp3'){
                return reply.status(400).send({error:'Invalid input type, please upload a MP3'})
            }
        const fileBaseName= path.basename(data.filename, extension) // nome do arquivo sem a extensão
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}` // criar o nome do aquivo utilizando um id único
         
        const uploadDestionation = path.resolve(__dirname, '../../tmp', fileUploadName) // onde vai salvar o arquivo

        await pump(data.file, fs.createWriteStream(uploadDestionation))

        // o stream do node já vai salvando enquanto faz o upload não espera terminar para não ocupar memória
        //o pipeline é pra aguardar esse processo.


        const video = await prisma.video.create({ // registrar no banco de dados o video
            data:{
                name:data.filename,
                path:uploadDestionation,
            }
        })
      return {
        video,
      }
    })
}