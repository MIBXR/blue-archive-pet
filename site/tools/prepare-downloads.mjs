import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const directory=new URL('../downloads/',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('agent-install.json',directory),'utf8'));
for(const pet of Object.values(metadata.pets)){
  const target=new URL(pet.package_file,directory);
  const checksum=bytes=>createHash('sha256').update(bytes).digest('hex');
  try{if(checksum(await readFile(target))===pet.package_sha256){console.log(`${pet.version}: ${pet.package_file} verified`);continue;}}catch(error){if(error.code!=='ENOENT')throw error;}
  const source=new URL(pet.release_url);
  if(source.protocol!=='https:'||source.hostname!=='github.com'||!source.pathname.startsWith('/MIBXR/blue-archive-pet/releases/download/')||source.pathname.includes('/latest/')||!source.pathname.endsWith('/'+pet.package_file))throw Error('Unexpected release URL');
  const response=await fetch(source);
  if(!response.ok)throw Error(`Release download failed (${response.status})`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(checksum(bytes)!==pet.package_sha256)throw Error(`Checksum mismatch: ${pet.package_file}`);
  const temporary=new URL(pet.package_file+'.tmp',directory);
  try{await writeFile(temporary,bytes);await rename(temporary,target);}catch(error){await unlink(temporary).catch(()=>{});throw error;}
  console.log(`${pet.version}: ${pet.package_file} prepared and verified`);
}
