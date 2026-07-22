async function compress(str: string): Promise<string> {
  const stream = new CompressionStream('gzip')
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()
  writer.write(encoder.encode(str))
  writer.close()
  const compressed = await new Response(stream.readable).arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(compressed)))
}

async function decompress(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const stream = new DecompressionStream('gzip')
  const writer = stream.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const decompressed = await new Response(stream.readable).arrayBuffer()
  return new TextDecoder().decode(decompressed)
}

export { compress, decompress }
