import React, { useId } from 'react';
import { Fingerprint } from 'lucide-react';

export function IdentityChamber({ count }: { count: number }) {
  const id = useId();
  const paint = (name: string) => 'url(#' + id + name + ')';
  // Front and back faces share a silhouette so the refractive rim follows the curved lens.
  const lens = 'M209 23C243 12 271 28 277 64C284 110 263 166 228 194C209 210 187 214 164 202C132 185 117 150 119 116C121 81 145 52 176 38Z';
  return <svg className="studio-object" viewBox="60 0 280 269" aria-hidden="true">
    <defs>
      <linearGradient id={id+'edge'} x1="0" y1=".1" x2="1" y2=".9">
        <stop stopColor="#dfffff"/><stop offset=".2" stopColor="#6cbbe6"/><stop offset=".43" stopColor="#114693"/>
        <stop offset=".68" stopColor="#163b89"/><stop offset=".83" stopColor="#60f0fa"/><stop offset="1" stopColor="#22446a"/>
      </linearGradient>
      <radialGradient id={id+'body'} cx=".67" cy=".3" r=".85">
        <stop stopColor="var(--lens-center)" stopOpacity=".75"/><stop offset=".48" stopColor="var(--lens-water)" stopOpacity=".77"/>
        <stop offset=".79" stopColor="var(--lens-deep)" stopOpacity=".9"/><stop offset=".95" stopColor="#43cbe1" stopOpacity=".87"/><stop offset="1" stopColor="#c3faff"/>
      </radialGradient>
      <linearGradient id={id+'veil'} x1="0" y1="0" x2=".9" y2="1">
        <stop stopColor="#fff" stopOpacity=".68"/><stop offset=".43" stopColor="#abf7ff" stopOpacity=".11"/><stop offset="1" stopColor="#86edff" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id={id+'steel'}><stop stopColor="#101b28"/><stop offset=".18" stopColor="#3e5266"/><stop offset=".44" stopColor="#101c29"/><stop offset=".8" stopColor="#101c29"/><stop offset=".94" stopColor="#425969"/><stop offset="1" stopColor="#12202c"/></linearGradient>
      <radialGradient id={id+'seat'} cy=".2"><stop stopColor="var(--lens-water)"/><stop offset=".61" stopColor="#244052"/><stop offset="1" stopColor="#192737"/></radialGradient>
      <radialGradient id={id+'shadow'}><stop stopColor="#061323" stopOpacity=".85"/><stop offset="1" stopColor="#031323" stopOpacity="0"/></radialGradient>
      <clipPath id={id+'cut'}><path d={lens}/></clipPath>
    </defs>
    <ellipse cx="197" cy="241" rx="125" ry="22" fill={paint('shadow')}/>
    <path d="M89 213C89 196 139 186 202 186S311 197 311 213V225C311 242 257 252 201 252S89 242 89 225Z" fill={paint('steel')}/>
    <ellipse cx="200" cy="213" rx="111" ry="26" fill={paint('seat')} stroke="#648b99"/>
    <ellipse cx="200" cy="211" rx="81" ry="17" fill="#101f31" stroke="#638898"/>
    <ellipse cx="200" cy="211" rx="58" ry="10" fill={paint('shadow')}/>
    <path d={lens} transform="translate(10 3)" fill={paint('edge')}/>
    <path d={lens} fill={paint('body')} stroke={paint('edge')} strokeWidth="2.2"/>
    <g clipPath={paint('cut')}>
      <path d="M117 150C125 96 150 100 176 85S224 31 271 31L236 15 167 27 110 75Z" fill={paint('veil')}/>
      <path d="M120 171C142 198 171 197 196 186S241 140 280 130C267 180 219 231 164 213Z" fill="var(--lens-ripple)" opacity=".35"/>
      <path d="M132 170C157 209 204 194 228 164S264 120 277 118" fill="none" stroke="#95ebff" strokeOpacity=".49" strokeWidth="1.7"/>
      <g transform="matrix(.94 -.24 .04 1 147 82)">
        <Fingerprint width="101" height="101" stroke="var(--lens-mark)" strokeWidth=".95"/>
      </g>
      <path d="M128 111C135 79 157 56 186 44" fill="none" stroke="#efffff" strokeWidth="3" strokeLinecap="round" opacity=".86"/>
      <path d="M229 31C255 26 267 42 269 60" fill="none" stroke="#b7f3ff" strokeWidth="1.3" opacity=".73"/>
    </g>
    <path d="M116 236Q141 244 170 244" fill="none" stroke="#7cd8e9" strokeWidth="1.3"/>
    <text x="222" y="245" textAnchor="middle" fill="#bfd8e1" fontFamily="monospace" fontSize="8" letterSpacing="1.3">SA / {count}</text>
    <circle className="studio-port" cx="90" cy="215" r="2.6" fill="var(--mint)"/>
  </svg>;
}

export function RegistrationSeal() {
  const id = useId();
  return <svg className="studio-seal" viewBox="0 0 190 152" aria-hidden="true">
    <defs>
      <linearGradient id={id+'face'} x1="0" y1=".3" x2="1" y2=".8"><stop stopColor="var(--seal-glint)"/><stop offset=".38" stopColor="var(--seal-face)" stopOpacity=".76"/><stop offset=".77" stopColor="var(--seal-face)" stopOpacity=".46"/><stop offset="1" stopColor="var(--seal-glint)"/></linearGradient>
      <linearGradient id={id+'edge'}><stop stopColor="var(--seal-glint)"/><stop offset=".47" stopColor="var(--seal-edge)"/><stop offset="1" stopColor="var(--seal-face)"/></linearGradient>
      <radialGradient id={id+'shadow'}><stop stopColor="#1b0f33" stopOpacity=".66"/><stop offset="1" stopColor="#1b0f33" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="96" cy="133" rx="82" ry="14" fill={'url(#'+id+'shadow)'}/>
    {[42,22,0].map(dy=><g key={dy} transform={'translate(0 '+dy+')'}>
      <path d="M16 56L92 19Q96 17 101 19L173 48V56L101 94Q96 97 91 95L16 64Z" fill={'url(#'+id+'edge)'} stroke="var(--seal-edge)"/>
      <path d="M16 56L92 19Q96 17 101 19L173 48L101 86Q96 89 91 87Z" fill={'url(#'+id+'face)'} stroke="var(--seal-glint)" strokeWidth="1.3"/>
      {dy===0 && <path d="M81 46L68 53 83 60M111 41L124 47 111 54M104 39L88 63" fill="none" stroke="var(--seal-glyph)" strokeWidth="3" strokeLinecap="round"/>}
    </g>)}
    <circle className="studio-port" cx="16" cy="103" r="2" fill="var(--violet)"/>
  </svg>;
}
