/**
 * Pixel Art Hero — v5
 * NO solid background fill. Canvas is transparent — site bg shows through.
 * Scene elements float on the page. Edge fades blend into #070709.
 *
 * Fixes:
 * – No rectangular canvas "box" (removed all solid bg fills)
 * – Chair always drawn BEFORE desk apron so it never pops in front
 * – Character layered by x-position: behind desk apron when cx > DESK_LEFT
 * – Stand-up / sit-down phases show proper standing pose
 *
 * Virtual canvas: 204 × 152  ×3 = 612 × 456
 */
(function () {
  'use strict';

  /* ═══ PALETTE ═══════════════════════════════════════════════════════ */
  const P = {
    gold:    '#F0B429', violet: '#A78BFA', blue:  '#60A5FA', emerald: '#34D399',
    white:   '#dde0f0',
    skin:    '#dba882', skinDk: '#b87050',
    hair:    '#180c06',
    hoodie:  '#1e1e3c', hoodH:  '#2c2c54',
    pants:   '#12122a', pantH:  '#1c1c38',
    shoes:   '#0c0c1a', shoeH:  '#1a1828',
    glassFr: '#2a2a50', glassL: 'rgba(96,165,250,0.22)',
    desk:    '#1e1a3c', deskH:  '#2c2556', deskB:  '#141230',
    chair:   '#1a1836', chairS: '#221e46',
    monBdy:  '#1c1c32', monScr: '#04040e', monBrd: '#60A5FA',
    monSide: '#0c0c1e', monTop: '#161630',
    kbdB:    '#181830', kbdKey: '#232344', kbdOn:  '#60A5FA',
    board:   '#141420', boardF: '#20203a', boardS: '#181826',
    marker:  '#34D399', mrkTip: '#1a7a55',
    termC:   ['#34D399','#60A5FA','#A78BFA','#F0B429'],
    /* MUST match --bg in CSS: used for edge fade */
    siteBg:  'rgba(7,7,9,',
  };

  /* ═══ SETUP ══════════════════════════════════════════════════════════ */
  const VW = 204, VH = 152, SCALE = 3;
  const canvas = document.getElementById('hero-3d');
  if (!canvas) return;
  canvas.width  = VW * SCALE;
  canvas.height = VH * SCALE;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.imageRendering = 'crisp-edges';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const vc = document.createElement('canvas');
  vc.width = VW; vc.height = VH;
  const g  = vc.getContext('2d');
  g.imageSmoothingEnabled = false;

  /* ═══ SCENE LAYOUT ════════════════════════════════════════════════════
   *
   *  [BOARD]              ← back wall, left
   *                [CHAIR-BACK]
   *                [CHAR-HEAD/TORSO]   ← visible above desk surface
   *  ────────────── DESK-SURFACE ──────────────────
   *                [LEGS hidden]
   *  ═══════════════ DESK-APRON ════════════════════  ← drawn OVER char
   *  ══════════════════ FLOOR ══════════════════════
   * ═══════════════════════════════════════════════════════════════════ */
  const FLOOR_Y   = 120;
  const BOARD_R   = { x: 4,   y: 6,   w: 46, h: 96  };
  const DESK_SURF = { x: 62,  y: 100, w: 136, h: 6  };
  const DESK_APR  = { x: 62,  y: 106, w: 136, h: 14 };
  const MON       = { x: 142, y: 63,  fw: 38, fh: 28 }; // d handled inside drawMonitor
  const KBD       = { x: 98,  y: 101, w: 30, h: 4  };
  const DESK_LEFT = 62;   // left edge of desk — character transitions here
  const DESK_CX   = 102;  // char centre when seated
  const WRITE_CX  = 56;   // char centre when writing at board

  /* ═══ PHASES ═════════════════════════════════════════════════════════
   * 0 TYPING    170 fr
   * 1 STAND_UP   22 fr
   * 2 WALK_L     46 fr
   * 3 WRITING   148 fr
   * 4 WALK_R     46 fr
   * 5 SIT_DOWN   22 fr
   * ═══════════════════════════════════════════════════════════════════ */
  const PH_DUR  = [170, 22, 46, 148, 46, 22];
  const PH_TOTAL = PH_DUR.reduce((a, b) => a + b, 0);
  const PH_START = PH_DUR.reduce((acc, d, i) => { acc[i] = (acc[i-1] ?? 0) + (PH_DUR[i-1] ?? 0); return acc; }, []);

  function getPhase(t) {
    const f = t % PH_TOTAL;
    for (let i = PH_DUR.length - 1; i >= 0; i--) {
      if (f >= PH_START[i]) return [i, f - PH_START[i]];
    }
    return [0, f];
  }

  function eio(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* ═══ STATE ══════════════════════════════════════════════════════════ */
  let tick = 0, paused = false;
  let fcTick = 0;
  const FC_TOTAL = 280; // full auto-gen cycle length in frames
  const TERM = [
    '>user_research.py','> analyzing 14k+ sessions',
    '> sprint velocity +40%','> shipping feature v2...',
    '> roadmap.md updated','> deploy --prod',
    '> impact: 7 countries',
  ];
  let tIdx = 0, tChar = 0, tHist = [], tTick = 0;

  const BSEGS = [
    {x1:4,y1:68,x2:38,y2:68},{x1:4,y1:74,x2:38,y2:74},
    {x1:4,y1:80,x2:28,y2:80},{x1:4,y1:68,x2:4,y2:84},
    {x1:38,y1:68,x2:38,y2:84},{x1:4,y1:84,x2:38,y2:84},
  ];
  let boardProg = 0, newStickyScale = 0, newStickyShown = false;

  /* ═══ HELPERS ════════════════════════════════════════════════════════ */
  const R  = (x,y,w,h,c)    => { g.fillStyle=c; g.fillRect(x|0,y|0,w|0,h|0); };
  const Px = (x,y,c,w=1,h=1)=> { g.fillStyle=c; g.fillRect(x|0,y|0,w,h); };
  function T(s,x,y,col,sz=3){ g.save(); g.fillStyle=col; g.font=`${sz}px monospace`; g.textBaseline='top'; g.fillText(s,x|0,y|0); g.restore(); }
  function Bx(x,y,w,h,col){  g.save(); g.strokeStyle=col; g.lineWidth=1; g.strokeRect((x|0)+.5,(y|0)+.5,(w|0)-1,(h|0)-1); g.restore(); }

  /* ═══ ATMOSPHERE — transparent canvas, no background fills ═══════════ */
  function drawAtmosphere() {
    // No background fills — canvas must remain 100% transparent so scene
    // looks correct on both dark AND light/white site backgrounds.
    // Only tiny clipped glows drawn directly over their elements (inside drawMonitor/drawBoard).
  }

  /* ═══ EDGE FADE — DISABLED (no dark fills on transparent canvas) ═════ */
  function drawEdgeFade() {
    // Removed — fading to a dark colour creates a visible rectangle on
    // light/white site backgrounds.  Canvas stays fully transparent.
  }

  /* ═══ WHITEBOARD ═════════════════════════════════════════════════════ */
  const BASE_STICKIES = [
    {rx:3, ry:12,rw:17,rh:11,col:'#F0B429',lbl:'Backlog'},
    {rx:24,ry:12,rw:17,rh:11,col:'#A78BFA',lbl:'Sprint'},
    {rx:3, ry:26,rw:17,rh:11,col:'#60A5FA',lbl:'UX Rev'},
    {rx:24,ry:26,rw:17,rh:11,col:'#34D399',lbl:'Ship!'},
    {rx:3, ry:40,rw:17,rh:11,col:'#F0B429',lbl:'Metric'},
    {rx:24,ry:40,rw:17,rh:11,col:'#A78BFA',lbl:'Retro'},
  ];
  const NEW_STICKY = {rx:13,ry:55,rw:18,rh:13,col:'#34D399',lbl:'✓ Done!'};

  function drawBoard() {
    const {x,y,w,h} = BOARD_R;
    // Board surface
    R(x,y,w,h,P.boardS);
    R(x,y,w,11,'#10101e');
    Px(x,y+11,'#20203a',w,1);
    T('PRODUCT BOARD',x+3,y+3,P.gold,3);
    R(x+w/2-2|0,y-2,5,4,P.gold);
    BASE_STICKIES.forEach(s => drawSticky(x+s.rx, y+13+s.ry, s.rw, s.rh, s.col, s.lbl, 1));
    if (newStickyScale > 0)
      drawSticky(x+NEW_STICKY.rx, y+13+NEW_STICKY.ry, NEW_STICKY.rw, NEW_STICKY.rh, NEW_STICKY.col, NEW_STICKY.lbl, newStickyScale);
    drawBoardContent(x, y);
  }

  function drawSticky(sx,sy,sw,sh,col,lbl,sc) {
    if (sc < 0.02) return;
    g.save();
    if (sc < 1) { g.translate(sx+sw/2,sy+sh/2); g.scale(sc,sc); g.translate(-(sx+sw/2),-(sy+sh/2)); }
    // No drop-shadow — would float visibly on transparent canvas
    R(sx,sy,sw,sh,col);
    g.fillStyle='rgba(0,0,0,0.18)';
    g.beginPath(); g.moveTo(sx+sw-3,sy); g.lineTo(sx+sw,sy); g.lineTo(sx+sw,sy+3); g.closePath(); g.fill();
    T(lbl,sx+2,sy+3,'rgba(0,0,0,0.7)',3);
    R(sx+2,sy+sh-4,sw-4,1,'rgba(0,0,0,0.25)');
    g.restore();
  }

  function drawBoardContent(bx,by) {
    const full = Math.floor(boardProg), frac = boardProg - full;
    g.globalAlpha = 0.52;
    for (let i=0;i<full&&i<BSEGS.length;i++) {
      const {x1,y1,x2,y2}=BSEGS[i];
      if (Math.abs(x2-x1)>=Math.abs(y2-y1)) R(bx+x1,by+y1,x2-x1,1,P.white);
      else R(bx+x1,by+y1,1,y2-y1,P.white);
    }
    g.globalAlpha = 1;
    if (full < BSEGS.length && frac > 0) {
      const {x1,y1,x2,y2}=BSEGS[full];
      const ex=x1+(x2-x1)*frac|0, ey=y1+(y2-y1)*frac|0;
      g.globalAlpha=0.72;
      if (Math.abs(x2-x1)>=Math.abs(y2-y1)) R(bx+x1,by+y1,ex-x1+1,1,P.marker);
      else R(bx+x1,by+y1,1,ey-y1+1,P.marker);
      g.globalAlpha=1;
      Px(bx+ex-1,by+ey-1,P.marker,3,3);
    }
  }

  /* ═══ DESK SURFACE ════════════════════════════════════════════════════ */
  function drawDeskSurface() {
    const {x,y,w} = DESK_SURF;
    // Legs (subtle, faint — just hints)
    R(x+5,   y+6, 7, FLOOR_Y-y-6, P.deskB);
    R(x+w-12,y+6, 7, FLOOR_Y-y-6, P.deskB);
    R(x+4,   FLOOR_Y-3,9,3,P.deskH);
    R(x+w-13,FLOOR_Y-3,9,3,P.deskH);
    // Surface edge highlight
    R(x,y-2,w,3,P.deskH);
    // Surface top
    R(x,y,w,6,P.desk);
  }

  /* ═══ DESK APRON — drawn OVER character lower body ════════════════════ */
  function drawDeskApron() {
    const {x,y,w,h} = DESK_APR;
    R(x,y,w,h,P.deskB);
    Px(x,y,'#1e1a3c',w,1);
    Px(x,y+h-1,P.deskH,w,1);
    // Subtle wood grain
    g.fillStyle='rgba(255,255,255,0.025)';
    for (let i=4;i<h;i+=5) g.fillRect(x,y+i,w,1);
  }

  /* ═══ CHAIR ——— ALWAYS drawn before apron ═════════════════════════════ */
  function drawChair() {
    const cx = DESK_CX - 2;
    const sy  = DESK_SURF.y;           // seat y = desk surface level
    // Legs (go from seat to floor — hidden by apron if behind desk)
    R(cx-9, sy+4, 4, FLOOR_Y-sy-4, P.chair);
    R(cx+5, sy+4, 4, FLOOR_Y-sy-4, P.chair);
    R(cx-10,FLOOR_Y-4, 20, 2, P.chair);  // crossbar
    // Seat
    R(cx-10, sy,   20, 4, P.chairS);
    Px(cx-10,sy,'#2c2858',20,1);
    // Chair back (above desk surface — visible behind character's torso)
    R(cx-8, sy-24, 16, 24, P.chair);
    R(cx-7, sy-22, 14, 20, P.chairS);
    Px(cx-6,sy-21,'#2c2858',12,1);
  }

  /* ═══ MONITOR — angled 3/4 view, clean parallelogram panels ════════════
   *
   *         D px
   *       ╔══╦══════════════════╗   ← top face (parallelogram)
   *      D║  ║                  ║
   *       ╠══╬══════════════════╣
   *       ║  ║   SCREEN FACE    ║ D  ← right face (parallelogram)
   *       ║  ║                  ║
   *       ╚══╩══════════════════╝
   *           stand
   * ═══════════════════════════════════════════════════════════════════════ */
  function drawMonitor() {
    const {x, y, fw, fh} = MON;
    const D = 5;   // depth of both 3D faces in pixels
    /* — corners of the front face — */
    const FL = x,      FT = y;          // front-face top-left
    const FR = x + fw, FB = y + fh;     // front-face bottom-right
    /* — corners offset for depth (upper-left direction = screen tilted toward viewer) — */
    const DX = D, DY = D;               // depth vector: left & up

    /* — Stand — */
    const stX = (FL + FR) / 2 - 2 | 0;
    R(stX,   FB,   5, 8, '#181830');
    R(stX-4, FB+7, 14, 2, '#181830');

    /* — Right side face (parallelogram, shares right edge of front face) —
     *  Vertices: FR,FT  →  FR+DX,FT-DY  →  FR+DX,FB-DY  →  FR,FB        */
    g.fillStyle = P.monSide;
    g.beginPath();
    g.moveTo(FR,    FT);
    g.lineTo(FR+DX, FT-DY);
    g.lineTo(FR+DX, FB-DY);
    g.lineTo(FR,    FB);
    g.closePath();
    g.fill();

    /* — Top face (parallelogram, shares top edge of front face) —
     *  Vertices: FL,FT  →  FR,FT  →  FR+DX,FT-DY  →  FL+DX,FT-DY        */
    g.fillStyle = P.monTop;
    g.beginPath();
    g.moveTo(FL,    FT);
    g.lineTo(FR,    FT);
    g.lineTo(FR+DX, FT-DY);
    g.lineTo(FL+DX, FT-DY);
    g.closePath();
    g.fill();

    /* — Screen (clipped so glow can't bleed) — */
    g.save();
    g.beginPath();
    g.rect(FL, FT, fw, fh);
    g.clip();

    R(FL, FT, fw, fh, P.monScr);

    // Screen scan-line shimmer
    const sg = g.createLinearGradient(FL, FT, FL, FB);
    sg.addColorStop(0, 'rgba(96,165,250,0.09)');
    sg.addColorStop(0.4,'rgba(96,165,250,0.04)');
    sg.addColorStop(1, 'rgba(96,165,250,0.01)');
    g.fillStyle = sg; g.fillRect(FL, FT, fw, fh);

    // Subtle scanlines
    g.fillStyle = 'rgba(0,0,0,0.08)';
    for (let row = FT; row < FB; row += 2) g.fillRect(FL, row, fw, 1);

    /* — Terminal content (inside clip so text never bleeds outside screen) — */
    drawTerminal(FL+3, FT+3, fw-6, fh-6);

    g.restore();  // end clip

    /* — Power LED — */
    Px(FR-4, FB-2, P.emerald, 2, 1);
  }

  function drawTerminal(tx,ty,tw,th) {
    R(tx,ty,tw,5,'#141428');
    Px(tx+2, ty+2,'#ff5f57',2,1);
    Px(tx+6, ty+2,'#febc2e',2,1);
    Px(tx+10,ty+2,'#28c840',2,1);
    const sy=ty+7, lh=5, maxV=Math.floor((th-8)/lh);
    tHist.forEach((l,i)=>T(l,tx,sy+i*lh,P.termC[i%4],3));
    if (tHist.length < maxV) {
      const pt=TERM[tIdx%TERM.length].substring(0,tChar), ci=tHist.length%4;
      T(pt,tx,sy+tHist.length*lh,P.termC[ci],3);
      if ((tick>>3)&1) R(tx+pt.length*3.6|0,sy+tHist.length*lh,2,4,P.termC[ci]);
    }
  }

  /* ═══ KEYBOARD ════════════════════════════════════════════════════════ */
  function drawKeyboard() {
    const {x,y,w}=KBD;
    R(x,y,w,4,P.kbdB); Px(x,y,'#22223e',w,1);
    for (let row=0;row<2;row++) for (let col=0;col<6;col++) {
      const on=((tick>>3)&1)&&((col+row)%2===0);
      R(x+2+col*4, y+1+row*2, 3,1, on?P.kbdOn:P.kbdKey);
    }
  }

  /* ═══ COFFEE ═════════════════════════════════════════════════════════ */
  function drawCoffee() {
    const cx=190,cy=100;
    R(cx,cy,8,8,'#1e1e34'); R(cx-1,cy,10,2,'#2a2a48');
    Px(cx+8,cy+2,'#2a2a48',1,4); Px(cx+9,cy+3,'#2a2a48',1,2);
    R(cx+1,cy+2,6,2,'#3a1e00');
    const sa=[cx+2,cx+4,cx+6][Math.floor(tick/24)%3];
    Px(sa,cy-3,'rgba(255,255,255,0.2)',1,2);
  }

  /* ═══ CHARACTER — SEATED ══════════════════════════════════════════════ */
  function drawCharSitting(cx, pf) {
    const sy  = DESK_SURF.y;
    const arm = Math.floor(pf/10)%2;

    // Lower body (hidden by apron — drawn anyway for completeness)
    R(cx-8,sy+2,7,14,P.pants); R(cx+1,sy+2,7,14,P.pants);
    R(cx-9,FLOOR_Y-4,9,4,P.shoes); R(cx+1,FLOOR_Y-4,9,4,P.shoes);

    // Hoodie
    R(cx-7,sy-15,14,15,P.hoodie);
    Px(cx-7,sy-15,1,15,P.hoodH); Px(cx+6,sy-15,1,15,P.hoodH);
    Px(cx-6,sy-15,12,1,P.hoodH); Px(cx,sy-15,1,15,P.hoodH);
    R(cx-4,sy-4,8,5,P.hoodH);

    // Typing arms (alternating)
    if (arm===0) {
      R(cx-13,sy-10,5,9,P.hoodie); R(cx-14,sy-2,5,3,P.skin);
      R(cx+8, sy-12,5,7,P.hoodie); R(cx+8, sy-6,5,3,P.skin);
    } else {
      R(cx-13,sy-12,5,7,P.hoodie); R(cx-14,sy-6,5,3,P.skin);
      R(cx+8, sy-10,5,9,P.hoodie); R(cx+8, sy-2,5,3,P.skin);
    }

    // Neck
    R(cx-2,sy-20,4,5,P.skin);

    // Head
    R(cx-6,sy-33,12,13,P.skin);
    Px(cx-6,sy-33,1,13,P.skinDk); Px(cx+5,sy-33,1,13,P.skinDk);
    // Hair
    R(cx-6,sy-33,12,4,P.hair);
    R(cx-6,sy-33,2,8,P.hair); R(cx+4,sy-33,2,8,P.hair);
    // Hood back
    R(cx-7,sy-34,14,4,P.hoodie);
    Px(cx-8,sy-33,2,5,P.hoodie); Px(cx+6,sy-33,2,5,P.hoodie);
    // Glasses
    g.fillStyle=P.glassL; g.fillRect(cx-5,sy-27,4,3); g.fillRect(cx+1,sy-27,4,3);
    Bx(cx-5,sy-27,5,4,P.glassFr); Bx(cx+1,sy-27,5,4,P.glassFr);
    Px(cx-1,sy-26,'#3a3a62',2,1);
    Px(cx-7,sy-26,P.glassFr,2,1); Px(cx+5,sy-26,P.glassFr,2,1);
    // Face
    Px(cx,sy-22,P.skinDk);
    Px(cx-2,sy-19,P.skinDk,4,1);
    // Blink
    if (tick%180 < 3) R(cx-5,sy-27,4,3,P.skin);
  }

  /* ═══ CHARACTER — SIDE PROFILE ════════════════════════════════════════ */
  function drawCharSide(cx, fy, pf, facingLeft, idle) {
    const wf  = idle ? 0 : Math.floor(pf/6)%4;
    const d   = facingLeft ? -1 : 1;
    const lO  = [[5,-5],[2,-2],[-5,5],[-2,2]][wf];
    const aO  = [[-4,4],[-2,2],[4,-4],[2,-2]][wf];

    // Back shoe + leg
    g.globalAlpha=0.76;
    R(cx+lO[1]*d-(d>0?0:8), fy-3, 8,3,P.shoes);
    R(cx+lO[1]*d/2-2, fy-14, 5,11,P.pants);
    g.globalAlpha=1;

    // Body
    R(cx-4,fy-26,8,12,P.hoodie);
    Px(cx-4,fy-26,1,12,P.hoodH); Px(cx+3,fy-26,1,12,P.hoodH);

    // Back arm
    g.globalAlpha=0.70;
    R(cx+aO[1]*d-2,fy-24,4,9,P.hoodie);
    g.globalAlpha=1;

    // Front leg + shoe
    R(cx+lO[0]*d-2,fy-14,5,11,P.pants);
    const shX=cx+lO[0]*d+(d>0?0:-8);
    R(shX,fy-3,8,3,P.shoes);
    Px(d>0?shX+7:shX-1,fy-3,1,3,P.shoeH);

    // Front arm + hand
    R(cx+aO[0]*d-2,fy-24,4,9,P.hoodie);
    R(cx+aO[0]*d-2,fy-16,5,3,P.skin);

    // Neck + head
    R(cx-2,fy-30,4,4,P.skin);
    R(cx-4,fy-40,8,10,P.skin);
    Px(cx-4,fy-40,8,3,P.hair);
    Px(facingLeft?cx+3:cx-4,fy-40,1,7,P.hair);
    // Hood
    R(facingLeft?cx+1:cx-5,fy-41,5,4,P.hoodie);
    R(cx-4,fy-41,8,3,P.hoodie);
    // Eye + glasses
    const ex=facingLeft?cx-2:cx+2;
    Px(ex,fy-33,'#050510');
    g.fillStyle=P.glassL;
    g.fillRect(facingLeft?cx-4:cx+1,fy-34,3,3);
    Bx(facingLeft?cx-4:cx+1,fy-34,4,4,P.glassFr);
    Px(facingLeft?cx-5:cx+4,fy-30,P.skinDk);
  }

  /* ═══ CHARACTER — WRITING ════════════════════════════════════════════ */
  function drawCharWriting(cx, fy, pf) {
    const bob=[0,-1,-2][Math.floor(pf/12)%3];
    R(cx-7,fy-3,8,3,P.shoes); R(cx+2,fy-3,8,3,P.shoes);
    R(cx-5,fy-14,5,11,P.pants); R(cx+2,fy-14,5,11,P.pants);
    R(cx-4,fy-26,8,12,P.hoodie);
    Px(cx+3,fy-26,1,12,P.hoodH); Px(cx-4,fy-26,1,12,P.hoodH);
    // Writing arm → LEFT
    R(cx-12+bob,fy-23,9,3,P.hoodie);
    R(cx-14+bob,fy-24,4,4,P.skin);
    R(cx-18+bob,fy-24,5,2,P.marker);
    Px(cx-20+bob,fy-24,2,2,P.mrkTip);
    if (boardProg < BSEGS.length) {
      g.fillStyle='rgba(52,211,153,0.32)'; g.fillRect(cx-21+bob,fy-25,4,4);
    }
    // Other arm
    R(cx+4,fy-23,4,9,P.hoodie); R(cx+4,fy-15,4,3,P.skin);
    // Neck + head
    R(cx-2,fy-30,4,4,P.skin);
    R(cx-4,fy-40,8,10,P.skin);
    Px(cx-4,fy-40,8,3,P.hair); Px(cx+3,fy-40,1,7,P.hair);
    R(cx+1,fy-41,5,4,P.hoodie); R(cx-4,fy-41,8,3,P.hoodie);
    Px(cx-2,fy-33,'#050510');
    g.fillStyle=P.glassL; g.fillRect(cx-4,fy-34,3,3);
    Bx(cx-4,fy-34,4,4,P.glassFr);
    Px(cx-5,fy-30,P.skinDk);
  }

  /* ═══ DATA METRIC PARTICLES (typing phase) ══════════════════════════ */
  const METRICS = ['+40%','97%','↑23%','14k+','×2.4','NPS82','0.3s','+12%','99%','↑UX','3.2s','sprint+'];
  const dataParticles = [];
  let lastMetricTick = 0;

  function spawnDataParticle() {
    const {x,y,w} = KBD;
    dataParticles.push({
      lbl:  METRICS[Math.floor(Math.random()*METRICS.length)],
      x:    x + 2 + Math.random()*(w-4),
      y:    y - 3,
      vy:  -(0.22 + Math.random()*0.18),
      vx:   (Math.random()-0.5)*0.14,
      life: 1.0,
      decay:0.009 + Math.random()*0.007,
      col:  [P.gold,P.violet,P.blue,P.emerald][Math.floor(Math.random()*4)],
    });
  }

  function updateDataParticles(isTyping) {
    if (isTyping && dataParticles.length < 7 && (tick - lastMetricTick) >= 9) {
      spawnDataParticle();
      lastMetricTick = tick;
    }
    for (let i = dataParticles.length-1; i >= 0; i--) {
      const p = dataParticles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) dataParticles.splice(i, 1);
    }
  }

  function drawDataParticles() {
    dataParticles.forEach(p => {
      const a = Math.max(0, p.life);
      g.globalAlpha = a * 0.92;
      T(p.lbl, p.x|0, p.y|0, p.col, 3);
      // tiny glow dot under the label
      g.globalAlpha = a * 0.35;
      g.fillStyle = p.col;
      g.fillRect((p.x|0)-1, (p.y|0)+4, p.lbl.length*3.6|0, 1);
      g.globalAlpha = 1;
    });
  }

  /* ═══ PARTICLES ══════════════════════════════════════════════════════ */
  const PARTS = Array.from({length:12},(_,i)=>({
    x:10+Math.random()*182, y:10+Math.random()*104,
    vx:(Math.random()-.5)*.09, vy:-.04-Math.random()*.06,
    col:[P.gold,P.violet,P.blue,P.emerald][i%4],
    a:.13+Math.random()*.2,
  }));
  /* ═══ FLOWCHART — auto-generating, above desk, right of board ════════
   * Area: x 58–138, y 5–62  (board ends x:50, monitor starts x:142)
   * Node centres:
   *   A (START)  97, 11   — gold
   *   D (diamond) 97, 26  — violet
   *   B (BUILD)   73, 41  — blue
   *   C (REVIEW) 121, 41  — emerald
   *   E (SHIP!)   97, 56  — gold
   * ════════════════════════════════════════════════════════════════════ */
  const FCN = {
    a: {x:97,  y:11},
    d: {x:97,  y:26},
    b: {x:73,  y:41},
    c: {x:121, y:41},
    e: {x:97,  y:56},
  };

  // alpha ramp: fade in after `start` over `dur` ticks; fade everything out at end
  function fcA(start, dur) {
    const fadeOut = fcTick > 245 ? Math.max(0, 1-(fcTick-245)/35) : 1;
    return Math.min(Math.max((fcTick-start)/dur, 0), 1) * fadeOut;
  }

  // Draw a partial pixel line with optional arrowhead nub
  function drawFCLine(x1,y1,x2,y2,prog,col) {
    if (prog <= 0) return;
    const ex = (x1+(x2-x1)*prog)|0, ey = (y1+(y2-y1)*prog)|0;
    const ddy = ey-y1, ddx = ex-x1;
    g.strokeStyle = col;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x1+0.5, y1+0.5);
    g.lineTo(ex+0.5, ey+0.5);
    g.stroke();
    if (prog > 0.88) {
      g.fillStyle = col;
      if (Math.abs(ddy) >= Math.abs(ddx)) {
        g.fillRect(ex-1, ey, 3, 1);
      } else {
        g.fillRect(ex, ey-1, 1, 3);
      }
    }
  }

  // Draw a labelled node rectangle
  function drawFCNode(cx,cy,nw,nh,col,lbl,alpha) {
    if (alpha < 0.02) return;
    g.globalAlpha = alpha;
    R(cx-(nw/2|0), cy-(nh/2|0), nw, nh, col);
    T(lbl, (cx - lbl.length*1.75)|0, cy-2, 'rgba(0,0,0,0.85)', 3);
    g.globalAlpha = 1;
  }

  function drawFlowChart() {
    const ARC = 'rgba(167,139,250,0.72)';

    // START node
    drawFCNode(FCN.a.x, FCN.a.y, 22, 7, '#F0B429', 'START', fcA(0,14));

    // Arrow A → diamond
    drawFCLine(FCN.a.x, FCN.a.y+4, FCN.d.x, FCN.d.y-6, fcA(17,14), ARC);

    // Decision diamond
    const dA = fcA(33,14);
    if (dA > 0.01) {
      g.globalAlpha = dA;
      g.fillStyle = '#A78BFA';
      g.beginPath();
      g.moveTo(FCN.d.x,    FCN.d.y-6);
      g.lineTo(FCN.d.x+12, FCN.d.y);
      g.lineTo(FCN.d.x,    FCN.d.y+6);
      g.lineTo(FCN.d.x-12, FCN.d.y);
      g.closePath();
      g.fill();
      T('?', FCN.d.x-2, FCN.d.y-2, '#fff', 3);
      g.globalAlpha = 1;
    }

    // Arrow diamond → B (left branch)
    drawFCLine(FCN.d.x-12, FCN.d.y, FCN.b.x+11, FCN.b.y-4, fcA(50,16), ARC);

    // BUILD node
    drawFCNode(FCN.b.x, FCN.b.y, 22, 7, '#60A5FA', 'BUILD', fcA(68,14));

    // Arrow diamond → C (right branch)
    drawFCLine(FCN.d.x+12, FCN.d.y, FCN.c.x-11, FCN.c.y-4, fcA(85,16), ARC);

    // REVIEW node
    drawFCNode(FCN.c.x, FCN.c.y, 26, 7, '#34D399', 'REVIEW', fcA(103,14));

    // Arrow B → SHIP
    drawFCLine(FCN.b.x+7, FCN.b.y+4, FCN.e.x-10, FCN.e.y-4, fcA(120,16), ARC);

    // Arrow C → SHIP
    drawFCLine(FCN.c.x-7, FCN.c.y+4, FCN.e.x+10, FCN.e.y-4, fcA(132,16), ARC);

    // SHIP! node
    drawFCNode(FCN.e.x, FCN.e.y, 22, 7, '#F0B429', 'SHIP!', fcA(150,14));

    g.globalAlpha = 1;
  }

  function drawParticles() {
    PARTS.forEach(pt=>{
      g.globalAlpha=pt.a*(0.5+0.5*Math.sin(tick*.038+pt.x));
      g.fillStyle=pt.col; g.fillRect(Math.round(pt.x),Math.round(pt.y),1,1);
      pt.x+=pt.vx; pt.y+=pt.vy;
      if(pt.y<-2)pt.y=FLOOR_Y-8;
      if(pt.x<0||pt.x>VW)pt.x=Math.random()*VW;
    });
    g.globalAlpha=1;
  }

  /* ═══ UNIFIED CHARACTER DRAW ═════════════════════════════════════════ */
  function drawChar(cx, mode, pf) {
    const fy = FLOOR_Y;
    if      (mode==='sitting')     drawCharSitting(cx, pf);
    else if (mode==='writing')     drawCharWriting(cx, fy, pf);
    else if (mode==='walk-left')   drawCharSide(cx, fy, pf, true,  false);
    else if (mode==='walk-right')  drawCharSide(cx, fy, pf, false, false);
    else if (mode==='stand-left')  drawCharSide(cx, fy, 0,  true,  true);
    else if (mode==='stand-right') drawCharSide(cx, fy, 0,  false, true);
  }

  /* ═══ UPDATE ══════════════════════════════════════════════════════════ */
  function update() {
    tick++;
    fcTick = (fcTick + 1) % FC_TOTAL;
    const [phase, pf] = getPhase(tick);
    if (phase===0) {
      updateDataParticles(true);
      tTick++;
      if (tTick>=3) {
        tTick=0;
        const line=TERM[tIdx%TERM.length];
        if (tChar<line.length) tChar++;
        else if (tick%34===0) {
          if(tHist.length>=4)tHist.shift();
          tHist.push(line); tIdx++; tChar=0;
        }
      }
    }
    if (phase!==0) updateDataParticles(false);
    if (phase===3) {
      boardProg=Math.min((pf/100)*BSEGS.length, BSEGS.length);
      if (pf>=108 && !newStickyShown) newStickyShown=true;
    }
    if (newStickyShown && newStickyScale<1) newStickyScale=Math.min(newStickyScale+0.07,1);
    if (phase===0 && pf===0) { boardProg=0; newStickyShown=false; newStickyScale=0; }
  }

  /* ═══ RENDER ══════════════════════════════════════════════════════════ */
  function render() {
    g.clearRect(0,0,VW,VH);
    const [phase, pf] = getPhase(tick);

    /* Character position & mode */
    let charX, charMode;
    if      (phase===0) { charX=DESK_CX; charMode='sitting'; }
    else if (phase===1) { charX=DESK_CX; charMode='stand-left'; }
    else if (phase===2) { charX=DESK_CX+(WRITE_CX-DESK_CX)*eio(pf/PH_DUR[2])|0; charMode='walk-left'; }
    else if (phase===3) { charX=WRITE_CX; charMode='writing'; }
    else if (phase===4) { charX=WRITE_CX+(DESK_CX-WRITE_CX)*eio(pf/PH_DUR[4])|0; charMode='walk-right'; }
    else                { charX=DESK_CX; charMode='stand-right'; }

    /* Is character currently behind the desk (x past left edge)? */
    const behindDesk = charX >= DESK_LEFT - 2;

    /* ── Layer order ────────────────────────────────────────────────── */
    drawAtmosphere();
    // Blue floor line
    g.fillStyle = '#60A5FA';
    g.fillRect(0, FLOOR_Y, VW, 1);
    drawParticles();
    drawBoard();
    drawFlowChart();

    /* Desk surface (legs etc) */
    drawDeskSurface();

    /* Chair: ALWAYS before apron so it's never wrongly in front */
    drawChair();

    /* Character if behind desk → drawn before apron (apron covers lower body) */
    if (behindDesk) drawChar(charX, charMode, pf);

    /* Desk apron: covers everything below desk surface */
    drawDeskApron();

    /* Desk-top objects (on top of apron) */
    drawMonitor();
    drawKeyboard();
    drawDataParticles();
    drawCoffee();

    /* Character if in front of desk (walked past left edge) */
    if (!behindDesk) drawChar(charX, charMode, pf);

    drawEdgeFade();

    /* Blit at 3× */
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(vc,0,0,VW,VH,0,0,VW*SCALE,VH*SCALE);
  }

  /* Throttle canvas to 30 fps — pixel art is indistinguishable at half rate
     and halves CPU/GPU cost, fixing jank in Chrome.                        */
  const TARGET_FPS = 30;
  const FRAME_MS   = 1000 / TARGET_FPS;
  let lastFrameTime = 0;

  function loop(ts) {
    requestAnimationFrame(loop);
    if (paused) return;
    if (ts - lastFrameTime < FRAME_MS) return;
    lastFrameTime = ts;
    update();
    render();
  }

  /* ═══ MOTION + VISIBILITY ════════════════════════════════════════════ */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotion() { paused=mq.matches||document.hidden; if(mq.matches)render(); }
  mq.addEventListener('change',applyMotion);
  document.addEventListener('visibilitychange',applyMotion);
  applyMotion();
  loop();

})();
