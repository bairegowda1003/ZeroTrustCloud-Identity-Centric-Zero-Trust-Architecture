import React, { useId } from 'react';
import { Cpu, Fingerprint, KeyRound } from 'lucide-react';

export function WorkloadCapsule() {
  const id = useId();
  const face = 'M9 21Q7 17 13 14L43 4Q48 2 53 5L65 12Q69 15 66 19L35 31Q31 33 26 31Z';
  return <svg className="studio-capsule" viewBox="0 0 78 58" aria-hidden="true">
    <defs>
      <linearGradient id={id+'glass'} x2=".72" y2="1">
        <stop stopColor="#a2e9fb"/><stop offset=".35" stopColor="var(--capsule-face,#397ba2)"/><stop offset=".74" stopColor="var(--capsule-core,#183e69)"/><stop offset="1" stopColor="#538eab"/>
      </linearGradient>
      <radialGradient id={id+'contact'}><stop stopColor="#06243e" stopOpacity=".58"/><stop offset="1" stopColor="#06243e" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="39" cy="51" rx="34" ry="6" fill={'url(#'+id+'contact)'}/>
    <path d="M9 21L34 30 67 16V35Q67 39 61 41L37 50Q32 52 27 49L12 40Q9 38 9 34Z" fill="#10273e" stroke="#506c80"/>
    <path d="M10 22L32 34V46L12 35Z" fill="#225377"/>
    <path d="M32 34V46" stroke="#56809e" strokeWidth=".8"/>
    <path d="M35 34L66 22V29L35 41Z" fill="#1d4462"/>
    <path d="M35 42L64 31M15 32L23 37" stroke="#75bed2" strokeWidth="1.2"/>
    <path d={face} fill="#0b233f" transform="translate(0 4)"/>
    <path d={face} fill={'url(#'+id+'glass)'} stroke="#87cada" strokeWidth="1"/>
    <g transform="matrix(1.06 -.39 .78 .49 17 17)"><Cpu width="23" height="23" stroke="#e1faff" strokeWidth="1.45"/></g>
  </svg>;
}

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
      <linearGradient id={id+'spec'}>
        <stop stopColor="#c5f8ff" stopOpacity="0"/><stop offset=".68" stopColor="#d5faff" stopOpacity=".16"/><stop offset="1" stopColor="#e9ffff" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <ellipse cx="197" cy="241" rx="125" ry="22" fill={paint('shadow')}/>
    <path d="M89 213C89 196 139 186 202 186S311 197 311 213V225C311 242 257 252 201 252S89 242 89 225Z" fill={paint('steel')}/>
    <ellipse cx="200" cy="213" rx="111" ry="26" fill={paint('seat')} stroke="#648b99"/>
    <ellipse cx="200" cy="211" rx="81" ry="17" fill="#101f31" stroke="#638898"/>
    <ellipse cx="200" cy="211" rx="58" ry="10" fill={paint('shadow')}/>
    <ellipse cx="190" cy="212" rx="32" ry="4" fill="var(--lens-water)" opacity=".22"/>
    <g className="studio-lens">
      <path d={lens} transform="translate(10 3)" fill={paint('edge')}/>
      <path d={lens} transform="translate(6 2)" fill="#183b66" stroke="#b0edff" strokeOpacity=".46"/>
      <path d={lens} fill={paint('body')} stroke={paint('edge')} strokeWidth="2.2"/>
      <g clipPath={paint('cut')}>
        <path d="M117 150C125 96 150 100 176 85S224 31 271 31L236 15 167 27 110 75Z" fill={paint('veil')}/>
        <path d="M120 171C142 198 171 197 196 186S241 140 280 130C267 180 219 231 164 213Z" fill="var(--lens-ripple)" opacity=".35"/>
        <path d="M132 170C157 209 204 194 228 164S264 120 277 118" fill="none" stroke="#95ebff" strokeOpacity=".49" strokeWidth="1.7"/>
        <path className="studio-reflection" d="M129 215L218 9H252L163 215Z" fill={paint('spec')}/>
        <g transform="matrix(.94 -.24 .04 1 147 82)">
          <Fingerprint width="101" height="101" stroke="var(--lens-mark)" strokeWidth=".95"/>
        </g>
        <path d="M128 111C135 79 157 56 186 44" fill="none" stroke="#efffff" strokeWidth="3" strokeLinecap="round" opacity=".86"/>
        <path d="M229 31C255 26 267 42 269 60" fill="none" stroke="#b7f3ff" strokeWidth="1.3" opacity=".73"/>
      </g>
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
      <linearGradient id={id+'face'} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="var(--seal-glint)"/><stop offset=".32" stopColor="var(--seal-face)"/><stop offset=".76" stopColor="var(--seal-core)" stopOpacity=".94"/><stop offset="1" stopColor="var(--seal-face)"/></linearGradient>
      <linearGradient id={id+'edge'}><stop stopColor="var(--seal-core)"/><stop offset=".48" stopColor="var(--seal-face)"/><stop offset=".53" stopColor="var(--seal-edge)"/><stop offset="1" stopColor="var(--seal-core)"/></linearGradient>
      <radialGradient id={id+'shadow'}><stop stopColor="#1b0f33" stopOpacity=".66"/><stop offset="1" stopColor="#1b0f33" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="96" cy="141" rx="83" ry="10" fill={'url(#'+id+'shadow)'}/>
    {[44,22,0].map(dy=><g key={dy} transform={'translate(0 '+dy+')'}>
      <path d="M16 56L92 19Q96 17 101 19L173 48V56L101 94Q96 97 91 95L16 64Z" fill={'url(#'+id+'edge)'} stroke="var(--seal-edge)"/>
      <path d="M16 56L92 19Q96 17 101 19L173 48L101 86Q96 89 91 87Z" fill={'url(#'+id+'face)'} stroke="var(--seal-glint)" strokeWidth=".95"/>
      <path d="M17 56L91 20Q96 17 101 20L117 26L47 55L31 61Z" fill="var(--seal-glint)" opacity=".15"/>
      <path d="M45 69L91 87Q96 89 101 86L142 66" fill="none" stroke="var(--seal-glint)" strokeWidth="1.4"/>
      {dy===0 && <g transform="matrix(1.5 .54 -.9 .82 91 35)"><KeyRound stroke="var(--seal-glyph)" strokeWidth="1.6"/></g>}
    </g>)}
    <circle className="studio-port" cx="16" cy="103" r="3" fill="var(--seal-edge)" stroke="var(--seal-glint)"/>
  </svg>;
}
