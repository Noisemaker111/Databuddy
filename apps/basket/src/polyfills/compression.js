// @bun
/*! MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
import zlib from 'node:zlib'
import stream from 'node:stream'

// fyi, Byte streams aren't really implemented anywhere yet
// It only exist as a issue: https://github.com/WICG/compression/issues/31

const make = (ctx, handle) => Object.assign(ctx, {
  readable: stream.Readable.toWeb(handle),
  writable: stream.Writable.toWeb(handle),
})

globalThis.CompressionStream ??= class CompressionStream {
  readable
  writable

  constructor(format) {
    make(this, format === 'deflate' ? zlib.createDeflate() :
    format === 'gzip' ? zlib.createGzip() : zlib.createDeflateRaw())
  }
}

globalThis.DecompressionStream ??= class DecompressionStream {
  readable
  writable

  constructor(format) {
    make(this, format === 'deflate' ? zlib.createInflate() :
    format === 'gzip' ? zlib.createGunzip() :
    zlib.createInflateRaw())
  }
} 