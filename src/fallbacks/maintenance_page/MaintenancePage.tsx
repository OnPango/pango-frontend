import { useEffect } from 'react';
import './style.css'
import { content } from './content';

const MaintenancePage = () => {
  useEffect(() => {
  let box = document.getElementById('dust'), s = 7;
  function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
  
  // [x%, y%] de los montículos de arena y la base del cono
  let src = [[6.7, 94], [20, 93], [91.6, 94], [60, 95]];
  for (let i = 0; i < 9; i++) {
    let p = src[i % src.length], e = document.createElement('i');
    e.className = 'puff';
    e.style.cssText = 'left:' + (p[0] + (r() - .5) * 5) + '%;top:' + (p[1] - 5) + '%;width:' + (5 + r() * 4) +
      '%;--d:' + (6 + r() * 4) + 's;--t:' + (-r() * 9) + 's;--x:' + ((r() - .5) * 90) + '%';
    box.appendChild(e);
  }
  for (let j = 0; j < 16; j++) {
    let m = document.createElement('i');
    m.className = 'mote';
    m.style.cssText = 'left:' + (4 + r() * 92) + '%;top:' + (30 + r() * 62) + '%;width:' + (.35 + r() * .35) +
      '%;--d:' + (5 + r() * 6) + 's;--t:' + (-r() * 10) + 's;--x:' + ((r() - .5) * 60) + 'px;--y:' + (-10 - r() * 40) + 'px';
    box.appendChild(m);
  }
  })


  return (
    <div className='flex flex-col justify-center items-center gap-10 p-5'>
      <div className="pango relative" role="img" aria-label="Pangolín con casco asomándose: estamos en mantenimiento">
        <h2 className='absolute font-body font-bold -top-36 md:-top-62.5 left-1/2 transform -translate-x-1/2 text-[200px] md:text-[400px] opacity-5 '>{content.error}</h2>
        <img className="full" src="img/base.png" alt="" />
        <img className="leaf l" style={{ left: '1.537%', top: '68.462%', width: '13.904%' }} src="img/leafL.png" alt="" />
        <img className="leaf r" style={{ left: '91.644%', top: '70.308%', width: '7.487%' }} src="img/leafR.png" alt="" />
        <img className="marks" style={{ left: '56.283%', top: '3.846%', width: '6.952%' }} src="img/lines.png" alt="" />
        <div className="lamp"></div>
        <div className="body">
          <img className="full" src="img/base.png" alt="" />
          <img className="eye" style={{ left: '40.107%', top: '57.231%', width: '4.211%' }} src="img/eyeL.png" alt="" />
          <img className="eye" style={{ left: '55.080%', top: '51.385%', width: '3.610%' }} src="img/eyeR.png" alt="" />
          <img className="nose" style={{ left: '47.259%', top: '60.769%', width: '8.088%' }} src="img/nose.png" alt="" />
        </div>
        <div className="dust" id="dust"></div>
      </div>

      <section className='flex flex-col justify-center items-center text-center gap-6'>
        <section className='flex flex-col justify-center items-center text-5xl md:text-7xl'>
          <h2 className='font-nunito font-extrabold'>{content.line1}</h2>
          <h2 className='font-nunito font-extrabold'>{content.line2}</h2>
        </section>
        <section className='text-md md:text-xl'>
          <p className='text-muted'>{content.line3}</p>
          <p className='text-muted'>{content.line4}</p>
        </section>
      </section>
    </div>
      
  )
}

export default MaintenancePage;