/**
 * =============================================================================
 * SCRIPT PARA GERAR RELATÓRIO COMPLETO DE LINKS DO CLOUDFLARE R2 (PAGINADO)
 * =============================================================================
 * Execução: node listar_r2.js
 */

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');

const R2_ACCOUNT_ID = '85dcb2881ca0921a38ff9aa95102371b';
const R2_ACCESS_KEY_ID = '8385cd4f5ef85c6e68258dde5d7c6d5e';
const R2_SECRET_ACCESS_KEY = 'e239cae9796ad76777dcc89b1468d397395001d8d2e6a1abe59fddedc2f5c036';
const BUCKET_NAME = 'retroplay-roms';
const PUBLIC_DOMAIN = 'https://pub-9cc5ba1ca4464cfea78f3f53ccebd465.r2.dev';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function gerarRelatorio() {
  console.log('🔄 Conectando ao Cloudflare R2 e buscando TODOS os arquivos de TODAS as pastas...');
  
  try {
    let todosObjetos = [];
    let continuationToken = undefined;

    // Loop de paginação para superar o limite de 1000 objetos por chamada do S3/R2
    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents && response.Contents.length > 0) {
        todosObjetos.push(...response.Contents);
      }

      continuationToken = response.NextContinuationToken;
      console.log(`📦 Encontrados ${todosObjetos.length} arquivos até o momento...`);
    } while (continuationToken);

    if (todosObjetos.length === 0) {
      console.log('⚠️ Nenhum arquivo encontrado no bucket.');
      return;
    }

    let relatorio = `===================================================\n`;
    relatorio += `📋 RELATÓRIO COMPLETO DE LINKS DO CLOUDFLARE R2 (${todosObjetos.length} arquivos totais)\n`;
    relatorio += `===================================================\n\n`;

    // Agrupamento por pasta para facilitar visualização
    const pastas = {};

    todosObjetos.forEach((item) => {
      // Ignora diretórios vazios
      if (item.Key.endsWith('/')) return;

      const partes = item.Key.split('/');
      const pastaNome = partes.length > 1 ? partes[0].toUpperCase() : 'RAIZ';

      if (!pastas[pastaNome]) {
        pastas[pastaNome] = [];
      }

      pastas[pastaNome].push(item);
    });

    let indexGeral = 1;
    for (const [pasta, arquivos] of Object.entries(pastas)) {
      relatorio += `---------------------------------------------------\n`;
      relatorio += `📁 PASTA: ${pasta} (${arquivos.length} arquivos)\n`;
      relatorio += `---------------------------------------------------\n\n`;

      arquivos.forEach((item) => {
        const urlPublica = `${PUBLIC_DOMAIN}/${item.Key.split('/').map(encodeURIComponent).join('/')}`;
        const tamanhoMb = (item.Size / (1024 * 1024)).toFixed(2);
        relatorio += `${indexGeral}. ${item.Key} (${tamanhoMb} MB)\n   Link: ${urlPublica}\n\n`;
        indexGeral++;
      });
    }

    fs.writeFileSync('meus_links_r2.txt', relatorio);

    console.log(`\n✅ Sucesso! Foi gerado o arquivo "meus_links_r2.txt" contendo ${todosObjetos.length} arquivos organizados por pasta (SNES, Mega Drive, etc)!`);
  } catch (error) {
    console.error('❌ Erro ao listar arquivos do R2:', error.message);
  }
}

gerarRelatorio();