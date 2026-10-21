import React from 'react';
export default function Image({src,alt='',fill,priority,unoptimized,loader,quality,placeholder,blurDataURL,style,...props}:any){return <img src={src} alt={alt} {...props} style={{...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{}),...style}}/>}
