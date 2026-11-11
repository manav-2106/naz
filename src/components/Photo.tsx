import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { config } from '../data/config'
import type { Memory } from '../data/memories'
import { CatHeart } from './doodles'

interface Props {
  memory: Memory
  fit?: 'cover' | 'contain'
  eager?: boolean
}

function toJpegFallback(src: string): string {
  return src.replace(/\.webp(\?.*)?$/i, '.jpeg$1')
}

function InnerPhoto({ memory, fit = 'cover', eager = false }: Props) {
  const [src, setSrc] = useState(memory.src)
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading')
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      setState('ok')
    }
  }, [src])

  const handleError = (): void => {
    const jpegSrc = toJpegFallback(src)
    if (jpegSrc !== src) {
      setSrc(jpegSrc)
      setState('loading')
    } else {
      setState('fail')
    }
  }

  return (
    <div className="absolute inset-0 bg-blush">
      {state !== 'ok' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blush to-petal p-3 text-center">
          <CatHeart className="w-1/4 max-w-[64px] opacity-80" />
          {state === 'fail' && <p className="font-hand text-lg leading-tight text-cocoa-soft">{config.ui.placeholder}</p>}
        </div>
      )}
      {state !== 'fail' && (
        <img
          ref={imgRef}
          src={src}
          alt={memory.alt}
          width={800}
          height={1000}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setState('ok')}
          onError={handleError}
          className={clsx(
            'absolute inset-0 h-full w-full transition-[opacity,transform] duration-700 ease-soft',
            fit === 'cover' ? 'object-cover' : 'object-contain',
            state === 'ok' ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
          )}
        />
      )}
    </div>
  )
}

/** Photo with a soft fade-in, cached-load check, and JPEG fallback. A missing file shows a pink placeholder instead of a broken icon. */
export default function Photo(props: Props) {
  return <InnerPhoto key={props.memory.src} {...props} />
}
