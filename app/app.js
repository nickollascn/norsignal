// NorSignal App – interaktiv prototype (ingen eksterne afhængigheder)
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ======================== MOCK DATA ======================== */
  const state = {
    view: 'home',
    history: [],
    alertFilter: 'Alle',
    selectedAlertId: 'a1',
    selectedReportId: 'r-nov-2026',
    selectedActorId: 'act1',
    reportExecMode: false,
    openAcc: new Set([0]),
    expoTab: 'creds',
    nis2LogCount: 14,
    rfiUsed: 4,
    rfiLimit: 12,
    typing: false,
    settings: {
      critPush: true,
      expoPush: true,
      reportPush: true,
      teams: false
    },
    user: {
      name: 'Søren Lindholm',
      initials: 'SL',
      role: 'CISO',
      org: 'Fjordvind Energi A/S',
      sector: 'Energi og forsyning',
      license: 'Enterprise',
      usersActive: '7 af 10 aktive',
      hosting: 'EU (Frankfurt)'
    }
  };

  const categories = [
    { name: 'Spionage', level: 'Meget høj', pct: 90, color: 'red', trend: '↑', trendCls: 'up' },
    { name: 'Ransomware', level: 'Høj', pct: 78, color: '', trend: '↑', trendCls: 'up' },
    { name: 'Hacktivisme / DDoS', level: 'Forhøjet', pct: 62, color: '', trend: '→', trendCls: '' },
    { name: 'Svindel / phishing', level: 'Moderat', pct: 45, color: 'lav', trend: '↓', trendCls: 'down' }
  ];

  const actors = [
    {
      id: 'act1',
      name: 'APT44 (Sandworm)',
      type: 'Statsaktør',
      hot: true,
      origin: 'Østeuropa',
      confidence: 'B2',
      short: 'Målretter europæisk energiinfrastruktur og OT-fjernadgang.',
      summary: 'Vores vurdering er, at aktøren fortsat udgør den mest kapable trussel mod nordiske energiselskaber. Aktiviteten i 4. kvartal har primært fokuseret på udnyttelse af perimeter-enheder og kompromittering af leverandørkonti.',
      mitre: ['T1190 Exploit Public-Facing App', 'T1078 Valid Accounts', 'T1021 Remote Services', 'T0886 Remote Services (ICS)'],
      relatedAlertId: 'a1'
    },
    {
      id: 'act2',
      name: 'RansomHub',
      type: 'Ransomware',
      hot: true,
      origin: 'Finansielt motiveret',
      confidence: 'B2',
      short: 'Øget aktivitet mod produktion, forsyning og underleverandører.',
      summary: 'Gruppen opererer efter en dobbelt afpresningsmodel med dataekfiltrering før kryptering. I de seneste 60 dage har gruppen offentliggjort tre europæiske energi- og forsyningsselskaber.',
      mitre: ['T1566 Phishing', 'T1486 Data Encrypted for Impact', 'T1567 Exfiltration Over Web'],
      relatedAlertId: 'a3'
    },
    {
      id: 'act3',
      name: 'NoName057(16)',
      type: 'Hacktivisme',
      hot: false,
      origin: 'Pro-russisk kollektiv',
      confidence: 'C3',
      short: 'Koordinerede DDoS-bølger mod nordiske hjemmesider og kundeportaler.',
      summary: 'Aktøren gennemfører kortvarige overbelastningsangreb med begrænset teknisk dybde, men synlig effekt på kundevendte portaler. Angrebene varsles ofte få timer forinden på offentlige Telegram-kanaler.',
      mitre: ['T1498 Network Denial of Service', 'T1499 Endpoint Denial of Service'],
      relatedAlertId: 'a2'
    },
    {
      id: 'act4',
      name: 'UNC5174',
      type: 'Adgangsmægler',
      hot: false,
      origin: 'Initial access broker',
      confidence: 'B3',
      short: 'Udnytter nyopdagede VPN-sårbarheder og videresælger adgange.',
      summary: 'Vi observerer systematisk masse-scanning inden for 24 timer efter offentliggørelse af sårbarheder i erhvervsrettede gateways. Opnåede adgange videresælges typisk til ransomware-operatører.',
      mitre: ['T1595 Active Scanning', 'T1190 Exploit Public-Facing App', 'T1133 External Remote Services'],
      relatedAlertId: 'a1'
    }
  ];

  const alerts = [
    {
      id: 'a1',
      sev: 'crit',
      sevLabel: 'Kritisk',
      kind: 'Sårbarhed',
      tlp: 'AMBER',
      admiralty: 'B2',
      time: 'i dag 08:14',
      shortTime: '08:14',
      date: '24. november 2026',
      unread: true,
      nis2Logged: false,
      desk: 'Energi-desk',
      title: 'Aktivt udnyttet sårbarhed i SSL-VPN-gateways (CVE-2026-2148)',
      sub: 'RCE uden autentificering · Matcher jeres registrerede teknologi',
      assessment: 'Vores vurdering er, at sandsynligheden for aktiv udnyttelse mod eksponerede gateways i branchen er meget høj i denne uge. Sårbarheden udnyttes allerede af både statsaktører og adgangsmæglere. Vi anbefaler patching inden for 24 timer.',
      context: 'Leverandøren udgav sikkerhedsopdatering den 23. november kl. 21:00. NorSignals indsamling viser udnyttelsesforsøg mod nordiske IP-ranges siden kl. 04:30 i morges. Ved succesfuld udnyttelse kan angriberen udlæse sessionsnøgler og etablere vedvarende adgang uden om MFA.',
      actions: [
        { text: 'Verificer firmwareversion på alle eksterne SSL-VPN-enheder og installer opdatering 7.4.6.', done: false },
        { text: 'Gennemgå VPN-logs siden 22. november for uventede sessioner fra ukendte ASN-netværk.', done: false },
        { text: 'Nulstil aktive bruger- og service-tokens efter gennemført opdatering.', done: false }
      ],
      mitre: ['T1190 Exploit Public-Facing App', 'T1133 External Remote Services', 'T1539 Steal Web Session Cookie'],
      sources: [
        { name: 'CFCS / ENISA sikkerhedsvarsel', rating: 'A1' },
        { name: 'Licenseret sårbarheds- og telemetrifeed', rating: 'B2' },
        { name: 'Nordisk Energi-ISAC deling', rating: 'B2' }
      ]
    },
    {
      id: 'a2',
      sev: 'high',
      sevLabel: 'Høj',
      kind: 'Kampagne',
      tlp: 'AMBER',
      admiralty: 'C3',
      time: 'i går 16:40',
      shortTime: 'i går',
      date: '23. november 2026',
      unread: true,
      nis2Logged: true,
      desk: 'Energi-desk',
      title: 'Hacktivister annoncerer DDoS-kampagne mod nordisk forsyning',
      sub: 'NoName057(16) nævner danske energi- og fjernvarmeselskaber',
      assessment: 'Vores vurdering er, at risikoen for forstyrrelse af kundevendte webportaler er forhøjet de næste 72 timer. Kampagnen forventes ikke at påvirke drift eller OT-netværk, men kan give midlertidig utilgængelighed på selvbetjening.',
      context: 'Kollektivet NoName057(16) har offentliggjort en opdateret målliste med fokus på nordisk infrastruktur. Tidligere bølger i oktober varede mellem 4 og 18 timer pr. bølge og benyttede HTTP/2-flooding.',
      actions: [
        { text: 'Bekræft at DDoS-beskyttelse og rate-limiting er aktiveret på selvbetjeningsportalen.', done: true },
        { text: 'Informer kundeservice og driftsovervågning om mulig kortvarig langsomhed.', done: false },
        { text: 'Hold geo-filtrering klar i WAF efter aftale med netværksleverandør.', done: false }
      ],
      mitre: ['T1498 Network Denial of Service', 'T1499.002 Service Exhaustion Flood'],
      sources: [
        { name: 'Passiv overvågning af offentlige kanaler', rating: 'C3' },
        { name: 'Telemetri fra nordisk MSSP-partner', rating: 'B2' }
      ]
    },
    {
      id: 'a3',
      sev: 'high',
      sevLabel: 'Høj',
      kind: 'Ransomware',
      tlp: 'AMBER',
      admiralty: 'B2',
      time: '2 dage',
      shortTime: '2 d',
      date: '22. november 2026',
      unread: true,
      nis2Logged: false,
      desk: 'Energi-desk',
      title: 'RansomHub lægger europæisk energiselskab på lækagesite',
      sub: 'Indgang via kompromitteret serviceleverandør i forsyningskæden',
      assessment: 'Vores vurdering er, at leverandørkonti fortsat er den primære indgang ved ransomware mod energisektoren. Ingen danske datterselskaber er identificeret i det offentliggjorte materiale, men metoden er direkte overførbar.',
      context: 'Angrebet skete via en delt fjernvedligeholdelseskonto uden geografisk adgangsbegrænsning. Angriberen brugte tre dage på lateral bevægelse før dataekfiltrering.',
      actions: [
        { text: 'Gennemgå samtlige aktive fjernadgange for eksterne serviceleverandører.', done: false },
        { text: 'Verificer at off-site backup er isoleret og testet inden for seneste kvartal.', done: false }
      ],
      mitre: ['T1199 Trusted Relationship', 'T1078 Valid Accounts', 'T1486 Data Encrypted for Impact'],
      sources: [
        { name: 'Dark web lækagemonitorering', rating: 'B2' },
        { name: 'Branche-ISAC hændelsesnotat', rating: 'B2' }
      ]
    },
    {
      id: 'a4',
      sev: 'med',
      sevLabel: 'Moderat',
      kind: 'Svindel',
      tlp: 'GREEN',
      admiralty: 'B3',
      time: '3 dage',
      shortTime: '3 d',
      date: '21. november 2026',
      unread: false,
      nis2Logged: false,
      desk: 'Energi-desk',
      title: 'Phishing-bølge udnytter falske måleraflæsnings-mails i Danmark',
      sub: 'Målrettet bogholderi og kundeservice i danske forsyningsselskaber',
      assessment: 'Kampagnen anvender velskrevet dansk og efterligner afregningsbilag fra kendte forsyningsaktører. Formålet er høst af Microsoft 365-loginoplysninger via adversary-in-the-middle-proxy.',
      context: 'Vi har registreret syv nyoprettede domæner med danske energitermer den seneste uge. Linket i mailen leder til en klonet login-side, som opfanger både adgangskode og MFA-cookie.',
      actions: [
        { text: 'Bloker de udsendte indikatorer (IOC) i mailgateway via STIX/TAXII-feed.', done: true },
        { text: 'Send kort varsel til økonomi- og kundeservicemedarbejdere.', done: true }
      ],
      mitre: ['T1566.002 Spearphishing Link', 'T1557 Adversary-in-the-Middle'],
      sources: [
        { name: 'Domæne- og certifikatovervågning', rating: 'B2' },
        { name: 'Indsendte phishing-eksempler fra kunder', rating: 'B3' }
      ]
    },
    {
      id: 'a5',
      sev: 'med',
      sevLabel: 'Moderat',
      kind: 'Sårbarhed',
      tlp: 'GREEN',
      admiralty: 'B2',
      time: '5 dage',
      shortTime: '5 d',
      date: '19. november 2026',
      unread: false,
      nis2Logged: true,
      desk: 'Energi-desk',
      title: 'Forøget scanning mod eksponerede OT- og SCADA-fjernportaler',
      sub: 'Automatiseret rekognoscering mod danske forsyningsnetværk',
      assessment: 'Aktiviteten vurderes som bred rekognoscering snarere end et målrettet angreb mod enkeltselskaber. Ingen succesfulde indtrængninger er bekræftet, men utilsigtede eksponeringer udgør en væsentlig risiko.',
      context: 'Scanningsaktiviteten stammer fra kendte VPS-udbydere og søger specifikt efter webgrænseflader til fjernstyring af transformerstationer og varmecentraler.',
      actions: [
        { text: 'Bekræft at ingen OT-grænseflader er direkte tilgængelige fra internettet.', done: true },
        { text: 'Kontroller segmentering mellem IT-netværk og produktionsnet.', done: false }
      ],
      mitre: ['T1595.001 Scanning IP Blocks', 'T0886 Remote Services (ICS)'],
      sources: [
        { name: 'Shodan / internettelemetri', rating: 'B2' },
        { name: 'NorSignal sensordata', rating: 'A2' }
      ]
    }
  ];

  const reports = [
    {
      id: 'r-nov-2026',
      title: 'Trusselsbillede: Energi og forsyning',
      period: 'November 2026',
      tlp: 'AMBER',
      readTime: 'Læsetid ca. 15 min',
      desk: 'Energi-desk · Danmark',
      summary: 'Vores vurdering er, at sandsynligheden for ransomware mod branchen er høj i 4. kvartal, mens truslen fra cyberspionage fortsat er meget høj. Vi anbefaler, at ledelsen prioriterer nedenstående tre tiltag.',
      sections: [
        {
          num: '1', red: false, title: 'Ledelsesresumé',
          exec: true,
          body: 'Det samlede trusselsniveau for danske energi- og forsyningsselskaber fastholdes på Forhøjet i november. Den væsentligste ændring denne måned er hurtigere udnyttelse af sårbarheder i fjernadgange samt målrettet aktivitet mod underleverandører.',
          bullets: [
            'Prioriter nødpatching af eksterne SSL-VPN-gateways (CVE-2026-2148) inden for 24 timer.',
            'Gennemfør gennemgang af eksterne leverandørers fjernadgange og MFA-krav.',
            'Dokumenter månedsrapportens risikovurdering i jeres NIS2-ledelseslog.'
          ]
        },
        {
          num: '2', red: false, title: 'Trusselsaktører og kampagner',
          exec: false,
          body: 'APT44 (Sandworm) og adgangsmæglere har øget rekognosceringen mod europæisk energiinfrastruktur (MITRE ATT&CK T1190 og T1133). Hacktivistgruppen NoName057(16) har varslet kortvarige DDoS-bølger mod nordiske forsyningsselskaber uden tegn på dybere netværksadgang. Kildevurdering: B2/C3.'
        },
        {
          num: '3', red: false, title: 'Ransomware og lækager',
          exec: false,
          body: 'I november blev fire europæiske forsynings- og industriselskaber offentliggjort på ransomware-lækagesites, primært af RansomHub og Akira. Fællesnævneren i tre af tilfældene var kompromitterede konti hos mindre drifts- og IT-leverandører.'
        },
        {
          num: '4', red: false, title: 'Prioriterede sårbarheder',
          exec: true,
          body: 'Tre aktivt udnyttede CVE-sårbarheder vurderes direkte relevante for branchens typiske teknologiplatforme i november:',
          bullets: [
            'CVE-2026-2148 (SSL-VPN gateway, CVSS 9.8) – aktivt udnyttet, patch straks.',
            'CVE-2026-1904 (Sikker filoverførsel, CVSS 8.6) – udnyttet af ransomware-aktører.',
            'CVE-2026-1711 (OT-overvågningsportal, CVSS 7.8) – begræns netværksadgang.'
          ]
        },
        {
          num: '5', red: false, title: 'Geopolitik og regulering',
          exec: true,
          body: 'CFCS fastholder trusselsvurderingen for cyberspionage mod Danmark på MEGET HØJ. Under NIS2 (i kraft 1. juli 2025) forventes ledelsen at kunne dokumentere løbende stillingtagen til branchespecifikke risici. Denne rapport er udarbejdet, så afsnit 1 og 4 kan indgå direkte i bestyrelsesreferatet.'
        },
        {
          num: '6', red: true, title: 'Jeres eksponering (Pro+)',
          exec: true,
          body: 'NorSignals eksponeringsmotor har i november identificeret to nye lækkede arbejds-credentials fra eksterne infostealer-logs samt ét nyregistreret lookalike-domæne (fjordvind-energi.com). Alle fund er synlige og håndterbare under fanen Eksponering.'
        }
      ]
    },
    {
      id: 'r-oct-2026',
      title: 'Trusselsbillede: Energi og forsyning',
      period: 'Oktober 2026',
      tlp: 'AMBER',
      readTime: 'Læsetid ca. 14 min',
      desk: 'Energi-desk · Danmark',
      summary: 'Oktober var præget af øget phishing mod danske forsyningsselskaber og vedvarende spionageinteresse mod grøn omstilling og vindteknologi.',
      sections: [
        {
          num: '1', red: false, title: 'Ledelsesresumé', exec: true,
          body: 'Trusselsniveauet lå på Forhøjet gennem hele oktober. Leverandørkæden og identitetsstyring udgjorde de primære fokusområder for ledelsen.',
          bullets: [
            'Indfør phishing-resistent MFA (FIDO2) for privilegerede brugere.',
            'Opdater beredskabsplan for langvarig utilgængelighed hos nøgleleverandører.'
          ]
        },
        { num: '2', red: false, title: 'Trusselsaktører og kampagner', exec: false, body: 'Vedvarende spearfishing-aktivitet rettet mod projektledere og ingeniører i nordisk vind- og energisektor. Kildevurdering: B2.' },
        { num: '3', red: false, title: 'Ransomware og lækager', exec: false, body: 'Stabil aktivitet på europæisk niveau med 11 registrerede hændelser i energi og industri. Ingen bekræftede danske ofre i oktober.' },
        { num: '4', red: false, title: 'Prioriterede sårbarheder', exec: true, body: 'To højt prioriterede sårbarheder i fjernstyringssoftware og identity-providers blev udgivet og håndteret.' },
        { num: '5', red: false, title: 'Geopolitik og regulering', exec: true, body: 'Status på danske sektorvejledninger under NIS2 og krav til hændelsesrapportering inden for 24 timer.' },
        { num: '6', red: true, title: 'Jeres eksponering (Pro+)', exec: true, body: 'Én ældre lækage fra 2023 blev identificeret og markeret som håndteret. Ingen aktive brand-trusler i oktober.' }
      ]
    },
    {
      id: 'r-dk-q4',
      title: 'Trusselsbillede Danmark · Q4 2026',
      period: 'Kvartalsrapport · Q4 2026',
      tlp: 'CLEAR',
      readTime: '24 sider · Offentlig udgave',
      desk: 'NorSignal Analyse',
      summary: 'Tværgående vurdering af cybertruslen mod danske virksomheder på tværs af energi, tele, industri og IT.',
      sections: [
        {
          num: '1', red: false, title: 'Hovedkonklusioner for Danmark', exec: true,
          body: 'I denne udgave vurderer vores analytikere, at ransomware fortsat er den største trussel mod produktion og transport, at DDoS-angreb fra hacktivister rammer kommuner og forsyning, og at leverandørkæden i stigende grad udnyttes som indgang.',
          bullets: [
            'Ransomware mod mellemstore virksomheder er blevet mere målrettet mod forretningskritisk drift.',
            'NIS2 løfter kravene til dokumenteret ledelsesforankring i cirka 6.000 danske virksomheder.'
          ]
        },
        { num: '2', red: false, title: 'Brancheoverblik', exec: false, body: 'Sammenligning af trusselsniveau på tværs af Energi og forsyning, Tele, Industri og grøn teknologi samt IT og software.' },
        { num: '3', red: false, title: 'Tre spørgsmål til bestyrelsen', exec: true, body: '1) Hvilke trusselsaktører er aktive i vores branche? 2) Hvilke af vores systemer er mest udsatte? 3) Hvordan udvikler truslen sig det kommende kvartal?' }
      ]
    },
    {
      id: 'r-board-q3',
      title: 'Bestyrelsesbriefing · Q3 2026',
      period: 'Kvartalsvis leverance',
      tlp: 'GREEN',
      readTime: 'Læsetid ca. 6 min',
      desk: 'Energi-desk · Fjordvind Energi',
      summary: 'Kortfattet risikobillede udarbejdet til bestyrelsesmødet i 3. kvartal, inkl. status på eksponering og NIS2-parathed.',
      sections: [
        {
          num: '1', red: false, title: 'Status til bestyrelsen', exec: true,
          body: 'Fjordvind Energis eksterne eksponering vurderes som lav til moderat sammenlignet med branchen. Anbefalet fokus i 4. kvartal er leverandørstyring og hurtigere håndtering af perimeter-sårbarheder.'
        },
        { num: '2', red: false, title: 'NIS2-dokumentationsspor', exec: true, body: 'Samtlige tre månedlige trusselsvurderinger i Q3 er gennemgået af sikkerhedsansvarlig og arkiveret i NIS2-loggen.' }
      ]
    }
  ];

  const exposures = {
    creds: [
      {
        id: 'e1',
        value: 'm.h****@fjordvind.dk',
        source: 'Infostealer-log · fundet i går',
        detail: 'Konto optræder i ny samling fra privat enhed. Adgangskode bør nulstilles og aktive sessioner tilbagekaldes.',
        status: 'new',
        sev: 'crit'
      },
      {
        id: 'e2',
        value: 'k.l****@fjordvind.dk',
        source: 'Tredjeparts-lækage · 4 dage siden',
        detail: 'Arbejdsmail anvendt på ekstern konferenceportal. Verificer at adgangskode ikke er genbrugt på interne systemer.',
        status: 'new',
        sev: 'high'
      },
      {
        id: 'e3',
        value: 'j.s****@fjordvind.dk',
        source: 'Historisk datalækage (2023)',
        detail: 'Adgangskode er tidligere roteret og MFA er bekræftet aktiv.',
        status: 'handled',
        sev: 'med'
      }
    ],
    domains: [
      {
        id: 'e4',
        value: 'fjordvind-energi.com',
        source: 'Lookalike-domæne · registreret i går',
        detail: 'DNS MX-records er konfigureret, hvilket øger sandsynligheden for phishing mod kunder eller ansatte. Anbefales blokeret i mailgateway.',
        status: 'new',
        sev: 'crit'
      },
      {
        id: 'e5',
        value: 'fjordvind-portal.net',
        source: 'Lookalike-domæne · 9 dage siden',
        detail: 'Domænet er parkeret uden aktivt webindhold eller mailopsætning. Overvåges automatisk for ændringer.',
        status: 'review',
        sev: 'med'
      },
      {
        id: 'e6',
        value: 'fjordvind-dk.org',
        source: 'Registreret i august 2026',
        detail: 'Vurderet som ikke-ondsindet og afmeldt efter dialog med registrator.',
        status: 'handled',
        sev: 'info'
      }
    ],
    mentions: [
      {
        id: 'e7',
        value: 'Underleverandør nævnt i forum',
        source: 'Kriminelt forum · 2 dage siden',
        detail: 'En af jeres registrerede IT-leverandører blev omtalt i forbindelse med salg af generiske RDP-adgange. Ingen indikation på direkte påvirkning af Fjordvind Energi.',
        status: 'review',
        sev: 'high'
      },
      {
        id: 'e8',
        value: 'Omtale i russisksproget kanal',
        source: 'Offentlig Telegram-kanal · 6 dage siden',
        detail: 'Fjordvind Energi fremgik af generisk liste over danske energiselskaber uden specifik angrebsplan. Vurderet til lav relevans.',
        status: 'handled',
        sev: 'info'
      }
    ]
  };

  const messages = [
    { type: 'day', text: 'I dag' },
    { from: 'me', text: 'Er DDoS-kampagnen fra i går også rettet mod mindre fjernvarme- og vindenergiselskaber?', time: '09:02' },
    { from: 'analyst', text: 'Ja. Vi har set tre nordiske forsyningsselskaber på gruppens mållister siden oktober. Vores vurdering er, at sandsynligheden for et kortvarigt angreb mod jeres kundevendte portal er moderat. Jeg sender en kort briefing her.', time: '09:17' },
    { from: 'file', title: 'Briefing: Nordisk DDoS mod forsyning', meta: 'PDF · 2 sider · TLP:GREEN', time: '09:18' },
    { from: 'me', text: 'Tak. Kan briefingen deles med direktionen til mødet i eftermiddag?', time: '09:19' },
    { from: 'analyst', text: 'Ja. Dokumentet er mærket TLP:GREEN og indeholder et halvt sides ledelsesresumé, så det kan deles internt og indgå i jeres NIS2-dokumentation.', time: '09:21' }
  ];

  const quickPrompts = [
    'Påvirker CVE-2026-2148 vores VPN?',
    'Vurder fjordvind-energi.com',
    'Kort NIS2-status til bestyrelsen'
  ];

  /* ======================== STAGE SIDEBAR COPY ======================== */
  const stageMeta = {
    home: {
      tag: 'Skærm 1 · Overblik',
      title: 'Branchespecifikt overblik uden støj',
      desc: 'CISO og IT-sikkerhedschef ser det aktuelle trusselsniveau for Energi og forsyning, udviklingen pr. kategori og de vigtigste alerts vurderet af NorSignals Energi-desk.'
    },
    alerts: {
      tag: 'Skærm 2 · Alerts',
      title: 'Prioriterede alerts med kildekvalitet',
      desc: 'Filtrer efter alvorlighed og kategori. Hver alert er klassificeret efter branche, mærket med TLP og vurderet på Admiralty-skalaen.'
    },
    'alert-detail': {
      tag: 'Detalje · Alert',
      title: 'Konklusion først, handling bagefter',
      desc: 'Analytikervurdering på dansk, konkret tjekliste der kan vinges af, MITRE ATT&CK-kortlægning og direkte logning til NIS2-dokumentation.'
    },
    'actor-detail': {
      tag: 'Detalje · Trusselsaktør',
      title: 'Hvem angriber jeres branche',
      desc: 'Indsigt i de trusselsaktører, der aktivt målretter nordisk energi og forsyning, koblet til konkrete teknikker og aktuelle alerts.'
    },
    reports: {
      tag: 'Skærm 3 · Rapporter',
      title: 'Kerneproduktet: Den månedlige rapport',
      desc: 'Faste månedlige brancherapporter, kvartalsvise trusselsbilleder og bestyrelsesbriefinger samlet ét sted.'
    },
    'report-detail': {
      tag: 'Detalje · Månedsrapport',
      title: 'Beslutningsgrundlag på 15 minutter',
      desc: 'Seks faste sektioner fra forretningsplanen samt en ledelsestilstand, der samler konklusioner og anbefalinger til direktion og bestyrelse.'
    },
    exposure: {
      tag: 'Skærm 4 · Eksponering (Pro+)',
      title: 'Overvågning af egen eksponering',
      desc: 'Lækkede credentials, nyregistrerede lookalike-domæner og omtale på dark web – med mulighed for direkte håndtering eller opfølgning hos analytiker.'
    },
    analyst: {
      tag: 'Skærm 5 · Analytiker (Enterprise)',
      title: 'Direkte adgang til branche-desk',
      desc: 'Navngiven analytikerkontakt og 12 årlige RFI-forespørgsler. Prøv selv at stille et spørgsmål eller brug en af genvejene i chatten.'
    },
    profile: {
      tag: 'Konto · Indstillinger',
      title: 'Licens, EU-hosting og integrationer',
      desc: 'Overblik over Enterprise-licens, notifikationer til push og Microsoft Teams samt aktivt STIX/TAXII-feed til kundens SIEM.'
    },
    login: {
      tag: 'Adgang · Log ind',
      title: 'Rolig og sikker opstart',
      desc: 'Single Sign-On via Microsoft Entra ID eller arbejdsmail. Alle kundedata hostes i EU i henhold til GDPR.'
    }
  };

  /* ======================== ICONS ======================== */
  const ico = {
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
    chev: '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
    file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    signal: `<svg class="sig" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="20" cy="80" r="10" fill="#EB0510" />
      <path class="arc" d="M20 47 A33 33 0 0 1 53 80" fill="none" stroke="#EB0510" stroke-width="13" />
      <path class="arc a2" d="M20 18 A62 62 0 0 1 82 80" fill="none" stroke="#EB0510" stroke-width="13" />
    </svg>`
  };

  /* ======================== HELPERS ======================== */
  const tlpBadge = tlp => {
    const cls = tlp === 'GREEN' ? 'green' : tlp === 'CLEAR' ? 'clear' : '';
    return `<span class="tlp ${cls}">TLP:${tlp}</span>`;
  };

  const countUnreadAlerts = () => alerts.filter(a => a.unread).length;
  const countOpenExposures = () =>
    [...exposures.creds, ...exposures.domains, ...exposures.mentions].filter(x => x.status === 'new').length;
  const countHandledExposures = () =>
    [...exposures.creds, ...exposures.domains, ...exposures.mentions].filter(x => x.status === 'handled').length;

  function updateBadges() {
    const u = countUnreadAlerts();
    const ba = $('#badge-alerts');
    ba.textContent = u;
    ba.hidden = u === 0;

    const e = countOpenExposures();
    const be = $('#badge-exposure');
    be.textContent = e;
    be.hidden = e === 0;
  }

  let toastTimer;
  function showToast(text) {
    const el = $('#toast');
    $('#toast-text').textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  let pushTimer;
  function triggerPush() {
    const el = $('#push-banner');
    el.classList.add('show');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => el.classList.remove('show'), 6500);
  }

  function updateStageSidebar() {
    const info = stageMeta[state.view] || stageMeta.home;
    $('#now-tag').textContent = info.tag;
    $('#now-title').textContent = info.title;
    $('#now-desc').textContent = info.desc;

    const mapJump = {
      'alert-detail': 'alerts',
      'actor-detail': 'home',
      'report-detail': 'reports'
    };
    const activeKey = mapJump[state.view] || state.view;
    $$('#stage-jump button[data-jump]').forEach(b => {
      b.classList.toggle('on', b.dataset.jump === activeKey);
    });
  }

  /* ======================== NAVIGATION ======================== */
  const topTabs = new Set(['home', 'alerts', 'reports', 'exposure', 'analyst']);

  function go(view, opts = {}) {
    const isBack = !!opts.back;
    if (!isBack && !topTabs.has(view) && view !== 'login' && state.view !== view) {
      state.history.push(state.view);
    }
    if (topTabs.has(view)) {
      state.history = [];
    }
    state.view = view;
    render(isBack ? 'enter-back' : topTabs.has(view) ? 'fade' : 'enter');
  }

  function goBack() {
    const prev = state.history.pop() || 'home';
    go(prev, { back: true });
  }

  /* ======================== RENDERERS ======================== */
  function renderHome() {
    const topAlerts = alerts.slice(0, 3);
    return `
      <div class="topbar">
        <div>
          <div class="org">${esc(state.user.org)} · ${esc(state.user.sector)}</div>
          <h1 class="title">Overblik</h1>
        </div>
        <button type="button" class="avatar" data-action="open-profile" aria-label="Konto og indstillinger">${esc(state.user.initials)}</button>
      </div>

      <section class="level" aria-label="Samlet trusselsniveau">
        ${ico.signal}
        <div class="lbl">TRUSSELSNIVEAU · ENERGI OG FORSYNING</div>
        <div class="val">Forhøjet</div>
        <div class="trend">Uændret siden sidste uge · Opdateret i dag 08:14</div>
        <div class="meter" aria-hidden="true">
          <i class="on"></i><i class="on"></i><i class="on hot"></i><i></i><i></i>
        </div>
        <div class="meter-labels">
          <span>Lav</span><span>Moderat</span><span>Forhøjet</span><span>Høj</span><span>Kritisk</span>
        </div>
      </section>

      <div class="section-label"><span>Trusselsniveau pr. kategori</span></div>
      <div class="card cats">
        ${categories.map(c => `
          <div class="cat">
            <div class="cat-top">
              <span>${esc(c.name)}</span>
              <span>${esc(c.level)} <b class="${c.trendCls}">${c.trend}</b></span>
            </div>
            <div class="bar"><i class="${c.color}" data-w="${c.pct}"></i></div>
          </div>
        `).join('')}
      </div>

      <div class="section-label">
        <span>Seneste alerts</span>
        <button type="button" data-action="go-alerts">Se alle →</button>
      </div>
      <div class="list">
        ${topAlerts.map(renderAlertRow).join('')}
      </div>

      <div class="section-label"><span>Månedlig rapport</span></div>
      <button type="button" class="teaser" data-action="open-report" data-id="r-nov-2026">
        <div>
          <div class="eyebrow">November 2026 · TLP:AMBER</div>
          <h3>Trusselsbillede: Energi og forsyning</h3>
          <p>Læsetid ca. 15 min · Klar til ledelse og NIS2</p>
        </div>
        <span class="round" aria-hidden="true">${ico.arrow}</span>
      </button>

      <div class="section-label"><span>Aktive aktører i branchen</span></div>
      <div class="hscroll">
        ${actors.map(a => `
          <button type="button" class="actor" data-action="open-actor" data-id="${a.id}">
            <div class="type ${a.hot ? 'r' : ''}">${esc(a.type)}</div>
            <h4>${esc(a.name)}</h4>
            <p>${esc(a.short)}</p>
          </button>
        `).join('')}
      </div>

      <p class="foot-note">NorSignal Energi-desk · Alle vurderinger efter Admiralty-skalaen</p>
    `;
  }

  function renderAlertRow(a) {
    return `
      <button type="button" class="row" data-action="open-alert" data-id="${a.id}">
        <span class="sev ${a.sev}"></span>
        <div>
          <div class="kind">${esc(a.kind)} · ${tlpBadge(a.tlp)} · ${esc(a.admiralty)}</div>
          <div class="ttl">${esc(a.title)}</div>
          <div class="sub">${esc(a.sub)}</div>
        </div>
        <div class="right">
          <span>${esc(a.shortTime)}</span>
          ${a.unread ? '<span class="unread" aria-label="Ulæst"></span>' : ico.chev}
        </div>
      </button>
    `;
  }

  function renderAlerts() {
    const filters = [
      { key: 'Alle', count: alerts.length },
      { key: 'Kritiske', count: alerts.filter(a => a.sev === 'crit' || a.sev === 'high').length },
      { key: 'Sårbarhed', count: alerts.filter(a => a.kind === 'Sårbarhed').length },
      { key: 'Kampagne', count: alerts.filter(a => a.kind === 'Kampagne').length },
      { key: 'Ransomware', count: alerts.filter(a => a.kind === 'Ransomware').length },
      { key: 'Svindel', count: alerts.filter(a => a.kind === 'Svindel').length }
    ];

    const list = alerts.filter(a => {
      if (state.alertFilter === 'Alle') return true;
      if (state.alertFilter === 'Kritiske') return a.sev === 'crit' || a.sev === 'high';
      return a.kind === state.alertFilter;
    });

    const unread = countUnreadAlerts();
    return `
      <div class="topbar">
        <div>
          <div class="org">${esc(state.user.sector)} · ${alerts.length} aktive</div>
          <h1 class="title">Alerts</h1>
        </div>
        ${unread > 0 ? `<button type="button" class="mini-btn ghost" data-action="mark-all-read">Marker læst</button>` : ''}
      </div>

      <div class="chips" role="tablist" aria-label="Filtrer alerts">
        ${filters.map(f => `
          <button type="button" class="chip ${state.alertFilter === f.key ? 'on' : ''}" data-action="filter-alerts" data-key="${f.key}">
            ${esc(f.key)}<b>${f.count}</b>
          </button>
        `).join('')}
      </div>

      ${list.length ? `<div class="list">${list.map(renderAlertRow).join('')}</div>` : '<div class="empty">Ingen alerts i denne kategori.</div>'}

      <p class="foot-note">Alerts leveres løbende til portal, app, e-mail og Microsoft Teams</p>
    `;
  }

  function renderAlertDetail() {
    const a = alerts.find(x => x.id === state.selectedAlertId) || alerts[0];
    const doneCount = a.actions.filter(x => x.done).length;
    return `
      <div class="detail-top">
        <div class="navbar">
          <button type="button" class="icon-btn dark" data-action="back" aria-label="Tilbage">${ico.back}</button>
          <span class="t">Alert</span>
        </div>
        <div class="detail-hero">
          <div style="display:flex;gap:8px;align-items:center">
            <span class="tag ${a.sev === 'crit' ? 'new' : a.sev}">${esc(a.sevLabel)}</span>
            ${tlpBadge(a.tlp)}
          </div>
          <h1>${esc(a.title)}</h1>
          <div class="meta-grid">
            <div><span>Kategori</span><b>${esc(a.kind)}</b></div>
            <div><span>Kildekvalitet</span><b>Admiralty ${esc(a.admiralty)}</b></div>
            <div><span>Publiceret</span><b>${esc(a.date)}</b></div>
            <div><span>Ansvarlig desk</span><b>${esc(a.desk)}</b></div>
          </div>
        </div>
      </div>

      <div class="block assess">
        <h3>Analytikervurdering</h3>
        <p class="q">${esc(a.assessment)}</p>
      </div>

      <div class="block">
        <h3 style="display:flex;justify-content:space-between;align-items:center">
          <span>Prioriterede anbefalinger</span>
          <span style="font-size:12px;color:var(--muted);font-weight:400">${doneCount} af ${a.actions.length}</span>
        </h3>
        ${a.actions.map((act, idx) => `
          <button type="button" class="todo ${act.done ? 'done' : ''}" data-action="toggle-todo" data-id="${a.id}" data-idx="${idx}">
            <span class="box">${ico.check}</span>
            <span>${esc(act.text)}</span>
          </button>
        `).join('')}
      </div>

      <div class="block">
        <h3>Baggrund og kontekst</h3>
        <p>${esc(a.context)}</p>
      </div>

      <div class="block">
        <h3>MITRE ATT&amp;CK</h3>
        <div class="mitre">
          ${a.mitre.map(m => `<span>${esc(m)}</span>`).join('')}
        </div>
      </div>

      <div class="block">
        <h3>Kilder og metode</h3>
        ${a.sources.map(s => `
          <div class="src-row">
            <span>${esc(s.name)}</span>
            <b>${esc(s.rating)}</b>
          </div>
        `).join('')}
      </div>

      <div class="actions">
        <button type="button" class="btn btn-red" data-action="ask-about-alert" data-id="${a.id}">Spørg analytiker om denne alert</button>
        <div class="btn-row">
          <button type="button" class="btn btn-dark" data-action="share-teams">Del til Teams</button>
          <button type="button" class="btn btn-ghost" data-action="log-nis2" data-id="${a.id}">
            ${a.nis2Logged ? 'Logget i NIS2' : 'Tilføj til NIS2-log'}
          </button>
        </div>
      </div>
    `;
  }

  function renderActorDetail() {
    const act = actors.find(x => x.id === state.selectedActorId) || actors[0];
    return `
      <div class="detail-top">
        <div class="navbar">
          <button type="button" class="icon-btn dark" data-action="back" aria-label="Tilbage">${ico.back}</button>
          <span class="t">Trusselsaktør</span>
        </div>
        <div class="detail-hero">
          <span class="tag ${act.hot ? 'new' : 'info'}">${esc(act.type)}</span>
          <h1>${esc(act.name)}</h1>
          <div class="meta-grid">
            <div><span>Profil</span><b>${esc(act.origin)}</b></div>
            <div><span>Kildevurdering</span><b>Admiralty ${esc(act.confidence)}</b></div>
          </div>
        </div>
      </div>

      <div class="block assess">
        <h3>Relevans for Energi og forsyning</h3>
        <p class="q">${esc(act.summary)}</p>
      </div>

      <div class="block">
        <h3>Observerede teknikker (MITRE ATT&amp;CK)</h3>
        <div class="mitre">
          ${act.mitre.map(m => `<span>${esc(m)}</span>`).join('')}
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-dark" data-action="open-alert" data-id="${act.relatedAlertId}">Se relateret alert</button>
        <button type="button" class="btn btn-ghost" data-action="ask-custom" data-q="Kan I give en kort status på ${esc(act.name)} og relevansen for vores miljø?">Spørg Energi-desk om ${esc(act.name)}</button>
      </div>
    `;
  }

  function renderReports() {
    const latest = reports[0];
    const archive = reports.slice(1);
    return `
      <div class="topbar">
        <div>
          <div class="org">${esc(state.user.sector)} · Klar til NIS2</div>
          <h1 class="title">Rapporter</h1>
        </div>
      </div>

      <div class="section-label" style="margin-top:8px"><span>Seneste månedsrapport</span></div>
      <button type="button" class="cover" data-action="open-report" data-id="${latest.id}">
        <div style="display:flex;gap:8px;align-items:center">
          ${tlpBadge(latest.tlp)}
          <span style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#cdbfd6">${esc(latest.period)}</span>
        </div>
        <h2>${esc(latest.title)}</h2>
        <p>${esc(latest.readTime)} · 6 sektioner · Ledelsesresumé</p>
      </button>

      <div class="section-label"><span>Arkiv og særudgivelser</span></div>
      <div class="list">
        ${archive.map(r => `
          <button type="button" class="row" data-action="open-report" data-id="${r.id}">
            <span class="sev ${r.tlp === 'CLEAR' ? 'info' : 'high'}"></span>
            <div>
              <div class="kind">${esc(r.period)} · ${tlpBadge(r.tlp)}</div>
              <div class="ttl">${esc(r.title)}</div>
              <div class="sub">${esc(r.readTime)} · ${esc(r.desk)}</div>
            </div>
            <div class="right">${ico.chev}</div>
          </button>
        `).join('')}
      </div>

      <p class="foot-note">Alle rapporter udgives på dansk den første tirsdag i måneden</p>
    `;
  }

  function renderReportDetail() {
    const r = reports.find(x => x.id === state.selectedReportId) || reports[0];
    const visibleSections = state.reportExecMode ? r.sections.filter(s => s.exec) : r.sections;
    return `
      <div class="navbar">
        <button type="button" class="icon-btn" data-action="back" aria-label="Tilbage">${ico.back}</button>
        <span class="t">Rapport</span>
      </div>

      <div class="cover">
        <div style="display:flex;gap:8px;align-items:center">
          ${tlpBadge(r.tlp)}
          <span style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#cdbfd6">${esc(r.period)}</span>
        </div>
        <h2>${esc(r.title)}</h2>
        <p>${esc(r.desk)} · ${esc(r.readTime)}</p>
      </div>

      <div class="block" style="padding:4px 16px">
        <div class="toggle-row">
          <div>
            Ledelsestilstand
            <small>Vis kun konklusioner, NIS2 og egen eksponering</small>
          </div>
          <button type="button" class="switch ${state.reportExecMode ? 'on' : ''}" data-action="toggle-exec-mode" role="switch" aria-checked="${state.reportExecMode}" aria-label="Skift ledelsestilstand"></button>
        </div>
      </div>

      <div class="section-label"><span>Indhold (${visibleSections.length} sektioner)</span></div>

      ${visibleSections.map((sec, i) => {
        const key = Number(sec.num) - 1;
        const open = state.reportExecMode || state.openAcc.has(key);
        return `
          <div class="acc ${open ? 'open' : ''}">
            <button type="button" class="acc-head" data-action="toggle-acc" data-idx="${key}" aria-expanded="${open}">
              <span class="num ${sec.red ? 'r' : ''}">${esc(sec.num)}</span>
              <h4>${esc(sec.title)}</h4>
              ${ico.chev}
            </button>
            <div class="acc-body">
              <p>${esc(sec.body)}</p>
              ${sec.bullets ? `<ol>${sec.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ol>` : ''}
            </div>
          </div>
        `;
      }).join('')}

      <div class="actions">
        <button type="button" class="btn btn-dark" data-action="export-pdf">Eksporter PDF til bestyrelse</button>
        <button type="button" class="btn btn-ghost" data-action="save-report-nis2">Gem i NIS2-dokumentation</button>
      </div>
    `;
  }

  function renderExposure() {
    const items = exposures[state.expoTab] || [];
    const openCount = countOpenExposures();
    const handledCount = countHandledExposures();

    const statusBadge = st => {
      if (st === 'new') return '<span class="tag new">NY</span>';
      if (st === 'review') return '<span class="tag med">VURDERING</span>';
      return '<span class="tag ok">HÅNDTERET</span>';
    };

    return `
      <div class="topbar">
        <div>
          <div class="org">Overvåger fjordvind.dk og 3 domæner</div>
          <h1 class="title">Eksponering</h1>
        </div>
      </div>

      <div class="tiles">
        <div class="tile ${openCount > 0 ? 'hot' : ''}"><b>${openCount}</b><span>Nye fund</span></div>
        <div class="tile"><b>4</b><span>Domæner</span></div>
        <div class="tile"><b>${handledCount}</b><span>Håndterede</span></div>
      </div>

      <div class="section-label"><span>Overvågede kategorier</span></div>
      <div class="segment" role="tablist">
        <button type="button" class="${state.expoTab === 'creds' ? 'on' : ''}" data-action="expo-tab" data-tab="creds">Credentials</button>
        <button type="button" class="${state.expoTab === 'domains' ? 'on' : ''}" data-action="expo-tab" data-tab="domains">Domæner</button>
        <button type="button" class="${state.expoTab === 'mentions' ? 'on' : ''}" data-action="expo-tab" data-tab="mentions">Omtale</button>
      </div>

      <div class="card">
        ${items.map(item => `
          <div class="expo-item">
            <div class="top">
              <div>
                <div class="${state.expoTab === 'mentions' ? 'ttl' : 'cred'}">${esc(item.value)}</div>
                <div class="sub">${esc(item.source)}</div>
              </div>
              ${statusBadge(item.status)}
            </div>
            <p class="sub" style="margin-top:8px;color:#4c3b52;line-height:1.45">${esc(item.detail)}</p>
            <div class="expo-actions">
              ${item.status !== 'handled'
                ? `<button type="button" class="mini-btn" data-action="handle-expo" data-id="${item.id}">Marker håndteret</button>`
                : `<button type="button" class="mini-btn ghost" data-action="reopen-expo" data-id="${item.id}">Genåbn</button>`
              }
              <button type="button" class="mini-btn ghost" data-action="ask-expo" data-val="${esc(item.value)}">Spørg analytiker</button>
            </div>
          </div>
        `).join('')}
      </div>

      <p class="foot-note">Eksponeringsmodul inkluderet i Professional og Enterprise</p>
    `;
  }

  function renderAnalyst() {
    const rfiBars = Array.from({ length: state.rfiLimit }, (_, i) =>
      `<i class="${i < state.rfiUsed ? 'on' : ''}"></i>`
    ).join('');

    return `
      <div class="analyst-head">
        <div class="avatar">MK</div>
        <div>
          <h3>Mikkel Kragh · Energi-desk</h3>
          <p><span class="online"></span>Tilgængelig · Forventet svartid under 4 timer</p>
        </div>
      </div>

      <div class="rfi">
        <span><strong>${state.rfiUsed} af ${state.rfiLimit}</strong> RFI'er brugt i 2026</span>
        <div class="meter-s" aria-hidden="true">${rfiBars}</div>
      </div>

      <div class="msgs" id="chat-msgs">
        ${messages.map(m => {
          if (m.type === 'day') return `<div class="day">${esc(m.text)}</div>`;
          if (m.from === 'file') {
            return `
              <button type="button" class="msg file" data-action="open-attachment" data-title="${esc(m.title)}">
                ${ico.file}
                <div>
                  <div style="font-weight:500">${esc(m.title)}</div>
                  <small style="margin-top:2px">${esc(m.meta)} · ${esc(m.time)}</small>
                </div>
              </button>
            `;
          }
          return `
            <div class="msg ${m.from === 'me' ? 'me' : ''}">
              ${esc(m.text)}
              <small>${m.from === 'me' ? 'Jer' : 'Mikkel Kragh'} · ${esc(m.time)}</small>
            </div>
          `;
        }).join('')}
        ${state.typing ? '<div class="typing" aria-label="Analytiker skriver"><i></i><i></i><i></i></div>' : ''}
      </div>

      <div class="quick" aria-label="Hurtige spørgsmål">
        ${quickPrompts.map(q => `<button type="button" data-action="quick-msg" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
      </div>
    `;
  }

  function renderProfile() {
    const s = state.settings;
    return `
      <div class="navbar">
        <button type="button" class="icon-btn" data-action="back" aria-label="Tilbage">${ico.back}</button>
        <span class="t">Konto og indstillinger</span>
      </div>

      <div class="profile-card">
        <div class="avatar">${esc(state.user.initials)}</div>
        <div>
          <h3>${esc(state.user.name)}</h3>
          <p>${esc(state.user.role)} · ${esc(state.user.org)}</p>
        </div>
      </div>

      <div class="license">
        <div><span>Licensniveau</span><b>${esc(state.user.license)}</b></div>
        <div><span>Analyseområde</span><b>${esc(state.user.sector)}</b></div>
        <div><span>Brugere</span><b>${esc(state.user.usersActive)}</b></div>
        <div><span>Datahosting</span><b>${esc(state.user.hosting)}</b></div>
      </div>

      <div class="section-label"><span>Notifikationer</span></div>
      <div class="settings">
        <div class="toggle-row">
          <div>Kritiske alerts (push)<small>Varsling straks ved aktiv udnyttelse</small></div>
          <button type="button" class="switch ${s.critPush ? 'on' : ''}" data-action="toggle-setting" data-key="critPush" role="switch" aria-checked="${s.critPush}"></button>
        </div>
        <div class="toggle-row">
          <div>Nye eksponeringsfund<small>Credentials, domæner og brand-omtale</small></div>
          <button type="button" class="switch ${s.expoPush ? 'on' : ''}" data-action="toggle-setting" data-key="expoPush" role="switch" aria-checked="${s.expoPush}"></button>
        </div>
        <div class="toggle-row">
          <div>Månedlig rapport udgivet<small>Besked første tirsdag i måneden</small></div>
          <button type="button" class="switch ${s.reportPush ? 'on' : ''}" data-action="toggle-setting" data-key="reportPush" role="switch" aria-checked="${s.reportPush}"></button>
        </div>
        <div class="toggle-row">
          <div>Levering til Microsoft Teams<small>Automatisk opslag i sikkerhedskanal</small></div>
          <button type="button" class="switch ${s.teams ? 'on' : ''}" data-action="toggle-setting" data-key="teams" role="switch" aria-checked="${s.teams}"></button>
        </div>
      </div>

      <div class="section-label"><span>Integrationer og governance</span></div>
      <div class="settings">
        <button type="button" class="link-row" data-action="info-toast" data-msg="STIX/TAXII 2.1 feed er tilsluttet jeres SIEM og sidst synkroniseret kl. 09:30.">
          <span>STIX/TAXII-feed</span><span>Aktiv · SIEM ${ico.chev}</span>
        </button>
        <button type="button" class="link-row" data-action="info-toast" data-msg="2 aktive API-nøgler registreret under EU-tenant.">
          <span>API-nøgler</span><span>2 aktive ${ico.chev}</span>
        </button>
        <button type="button" class="link-row" data-action="info-toast" data-msg="NIS2-eksportlog indeholder ${state.nis2LogCount} tidsstemplede vurderinger klar til revision.">
          <span>NIS2-eksportlog</span><span>${state.nis2LogCount} poster ${ico.chev}</span>
        </button>
        <button type="button" class="link-row" data-action="info-toast" data-msg="Alle vurderinger benytter Admiralty-skalaen (A1 til F6) og TLP-mærkning.">
          <span>Metode og kilder</span><span>Admiralty-skala ${ico.chev}</span>
        </button>
      </div>

      <div class="section-label"><span>Prototype-funktioner</span></div>
      <div class="settings">
        <button type="button" class="link-row" data-action="sim-push">
          <span>Simuler kritisk push-alert</span><span>Test nu ${ico.chev}</span>
        </button>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-ghost" data-action="logout">Log ud</button>
      </div>
    `;
  }

  function renderLogin() {
    return `
      <div class="login">
        <img src="../assets/logo-wordmark-white.png" alt="NorSignal" />
        <h1>Kend jeres trusselsbillede</h1>
        <p>Branchespecifik cyber threat intelligence for nordiske virksomheder – klar til ledelse og NIS2.</p>
        <div class="grow"></div>
        <form id="login-form">
          <input class="field" type="email" value="s.lindholm@fjordvind.dk" aria-label="Arbejdsmail" required />
          <button type="submit" class="btn btn-red" style="width:100%">Log ind med arbejdsmail</button>
        </form>
        <div class="or">eller</div>
        <button type="button" class="btn btn-light" style="width:100%" data-action="sso-login">Log ind med Microsoft Entra ID</button>
        <small>Alle kundedata hostes i EU · GDPR · Et Norlys-selskab</small>
      </div>
    `;
  }

  /* ======================== MAIN RENDER ======================== */
  function render(animClass = 'fade') {
    const root = $('#view-root');
    const tabbar = $('#tabbar');
    const composer = $('#composer');
    const statusbar = $('#statusbar');
    const homeInd = $('#home-ind');

    const isLogin = state.view === 'login';
    const showTabs = topTabs.has(state.view);
    const isDarkTop = state.view === 'alert-detail' || state.view === 'actor-detail';

    tabbar.hidden = !showTabs;
    composer.hidden = state.view !== 'analyst';
    statusbar.classList.toggle('light', isLogin || isDarkTop);
    homeInd.classList.toggle('light', isLogin);

    // Highlight active tab
    $$('#tabbar button[data-tab]').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.tab === state.view);
    });

    if (isLogin) {
      root.innerHTML = renderLogin();
    } else {
      let html = '';
      if (state.view === 'home') html = renderHome();
      else if (state.view === 'alerts') html = renderAlerts();
      else if (state.view === 'alert-detail') html = renderAlertDetail();
      else if (state.view === 'actor-detail') html = renderActorDetail();
      else if (state.view === 'reports') html = renderReports();
      else if (state.view === 'report-detail') html = renderReportDetail();
      else if (state.view === 'exposure') html = renderExposure();
      else if (state.view === 'analyst') html = renderAnalyst();
      else if (state.view === 'profile') html = renderProfile();

      const extraClasses = [
        'view',
        animClass,
        !showTabs ? 'no-tabs' : '',
        isDarkTop ? 'dark-top' : '',
        state.view === 'analyst' ? 'chat' : ''
      ].filter(Boolean).join(' ');

      root.innerHTML = `<div class="${extraClasses}" id="active-view">${html}</div>`;
    }

    // Animate bars on home screen
    if (state.view === 'home') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          $$('#active-view .bar i[data-w]').forEach(el => {
            el.style.width = el.dataset.w + '%';
          });
        });
      });
    }

    // Scroll analyst chat to bottom
    if (state.view === 'analyst') {
      const m = $('#chat-msgs');
      if (m) m.scrollTop = m.scrollHeight;
    }

    updateBadges();
    updateStageSidebar();
  }

  /* ======================== ANALYST REPLY LOGIC ======================== */
  function nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function generateAnalystReply(text) {
    const q = text.toLowerCase();
    if (q.includes('2148') || q.includes('vpn') || q.includes('sårbarhed')) {
      return 'Vores vurdering er, at CVE-2026-2148 bør håndteres som første prioritet i dag. Udnyttelsen er bekræftet (Admiralty B2) mod eksponerede gateways. Installer version 7.4.6 og nulstil aktive sessioner. Sig til, hvis vi skal gennemgå log-indikatorerne med jeres driftsteam.';
    }
    if (q.includes('fjordvind-energi') || q.includes('domæne') || q.includes('lookalike')) {
      return 'Domænet fjordvind-energi.com blev registreret i går med aktive MX-records, hvilket typisk indikerer forberedelse til phishing. Vi anbefaler blokering i mailgatewayen med det samme og kan indlede en dokumenteret takedown-vurdering for jer.';
    }
    if (q.includes('nis2') || q.includes('bestyrelse')) {
      return 'Jeg kan klargøre et ét-sides NIS2-ledelsesresumé baseret på november-rapporten og jeres seneste eksponeringsstatus. Det dokumenterer både trusselsvurdering og prioriterede tiltag og er klar i portalen inden kl. 14.';
    }
    if (q.includes('ransom') || q.includes('leverandør')) {
      return 'Sandsynligheden for ransomware mod europæiske forsyningsselskaber vurderes fortsat som høj i 4. kvartal. Den primære indgang er kompromitterede leverandørkonti. Vi anbefaler at verificere MFA og adgangsbegrænsning for eksterne servicekonti.';
    }
    if (q.includes('credential') || q.includes('@fjordvind')) {
      return 'Fundet stammer fra en nylig infostealer-log (Admiralty B2). Vi anbefaler nulstilling af adgangskode, tilbagekaldelse af aktive Microsoft 365-sessioner og kontrol af login-historik de seneste 14 dage.';
    }
    return 'Tak for henvendelsen. Jeg har registreret spørgsmålet som en RFI hos Energi-desk og vender tilbage med en samlet vurdering med kilder og anbefalinger inden for vores aftalte svartid på 4 timer.';
  }

  function sendChatMessage(raw) {
    const text = raw.trim();
    if (!text || state.typing) return;

    messages.push({ from: 'me', text, time: nowHHMM() });
    if (state.rfiUsed < state.rfiLimit) state.rfiUsed += 1;
    state.typing = true;
    render('');

    setTimeout(() => {
      state.typing = false;
      messages.push({ from: 'analyst', text: generateAnalystReply(text), time: nowHHMM() });
      if (state.view === 'analyst') {
        render('');
      } else {
        showToast('Nyt svar fra Mikkel Kragh · Energi-desk');
      }
    }, 900);
  }

  /* ======================== EVENT DELEGATION ======================== */
  $('#screen').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case 'back':
        goBack();
        break;
      case 'open-profile':
        go('profile');
        break;
      case 'go-alerts':
        go('alerts');
        break;
      case 'filter-alerts':
        state.alertFilter = btn.dataset.key;
        render('');
        break;
      case 'mark-all-read':
        alerts.forEach(a => (a.unread = false));
        render('');
        showToast('Alle alerts er markeret som læst');
        break;
      case 'open-alert': {
        const a = alerts.find(x => x.id === btn.dataset.id);
        if (a) a.unread = false;
        state.selectedAlertId = btn.dataset.id;
        go('alert-detail');
        break;
      }
      case 'open-actor':
        state.selectedActorId = btn.dataset.id;
        go('actor-detail');
        break;
      case 'toggle-todo': {
        const a = alerts.find(x => x.id === btn.dataset.id);
        const idx = Number(btn.dataset.idx);
        if (a && a.actions[idx]) {
          a.actions[idx].done = !a.actions[idx].done;
          render('');
        }
        break;
      }
      case 'share-teams':
        showToast('Alert delt til sikkerhedskanal i Microsoft Teams');
        break;
      case 'log-nis2': {
        const a = alerts.find(x => x.id === btn.dataset.id);
        if (a) {
          if (!a.nis2Logged) {
            a.nis2Logged = true;
            state.nis2LogCount += 1;
            showToast('Tilføjet til NIS2-dokumentationslog');
          } else {
            showToast('Allerede logget i NIS2-dokumentationen');
          }
          render('');
        }
        break;
      }
      case 'ask-about-alert': {
        const a = alerts.find(x => x.id === btn.dataset.id);
        go('analyst');
        if (a) sendChatMessage(`Hvad anbefaler Energi-desk som første skridt vedr. "${a.title}"?`);
        break;
      }
      case 'ask-custom':
        go('analyst');
        sendChatMessage(btn.dataset.q);
        break;
      case 'open-report':
        state.selectedReportId = btn.dataset.id;
        state.openAcc = new Set([0]);
        go('report-detail');
        break;
      case 'toggle-exec-mode':
        state.reportExecMode = !state.reportExecMode;
        render('');
        break;
      case 'toggle-acc': {
        const idx = Number(btn.dataset.idx);
        if (state.openAcc.has(idx)) state.openAcc.delete(idx);
        else state.openAcc.add(idx);
        render('');
        break;
      }
      case 'export-pdf':
        showToast('PDF eksporteret (TLP:AMBER · klar til bestyrelse)');
        break;
      case 'save-report-nis2':
        state.nis2LogCount += 1;
        showToast('Månedsrapport arkiveret i NIS2-log');
        break;
      case 'expo-tab':
        state.expoTab = btn.dataset.tab;
        render('');
        break;
      case 'handle-expo': {
        const item = exposures[state.expoTab].find(x => x.id === btn.dataset.id);
        if (item) {
          item.status = 'handled';
          render('');
          showToast('Fund markeret som håndteret');
        }
        break;
      }
      case 'reopen-expo': {
        const item = exposures[state.expoTab].find(x => x.id === btn.dataset.id);
        if (item) {
          item.status = 'new';
          render('');
          showToast('Fund genåbnet til opfølgning');
        }
        break;
      }
      case 'ask-expo':
        go('analyst');
        sendChatMessage(`Kan I vurdere eksponeringsfundet "${btn.dataset.val}" og anbefale næste skridt?`);
        break;
      case 'quick-msg':
        sendChatMessage(btn.dataset.q);
        break;
      case 'open-attachment':
        showToast(`Åbner "${btn.dataset.title}" (TLP:GREEN)`);
        break;
      case 'toggle-setting': {
        const k = btn.dataset.key;
        state.settings[k] = !state.settings[k];
        render('');
        showToast(state.settings[k] ? 'Indstilling aktiveret' : 'Indstilling deaktiveret');
        break;
      }
      case 'info-toast':
        showToast(btn.dataset.msg);
        break;
      case 'sim-push':
        go('home');
        setTimeout(triggerPush, 250);
        break;
      case 'logout':
        go('login');
        break;
      case 'sso-login':
        go('home');
        showToast('Logget ind som Søren Lindholm via Microsoft Entra ID');
        break;
    }
  });

  // Login form submit
  $('#screen').addEventListener('submit', e => {
    if (e.target.id === 'login-form') {
      e.preventDefault();
      go('home');
      showToast('Velkommen tilbage, Søren Lindholm');
    }
  });

  // Tab bar clicks
  $('#tabbar').addEventListener('click', e => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    go(btn.dataset.tab);
  });

  // Analyst chat composer
  $('#composer').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#chat-input');
    const val = input.value;
    input.value = '';
    sendChatMessage(val);
  });

  // Push notification tap -> opens critical alert
  $('#push-banner').addEventListener('click', () => {
    $('#push-banner').classList.remove('show');
    const a = alerts[0];
    a.unread = false;
    state.selectedAlertId = a.id;
    go('alert-detail');
  });

  // Desktop stage jump buttons
  $('#stage-jump').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'btn-sim-push') {
      if (state.view === 'login') go('home');
      triggerPush();
      return;
    }
    const target = btn.dataset.jump;
    if (!target) return;
    if (target === 'reports') {
      state.selectedReportId = 'r-nov-2026';
      state.openAcc = new Set([0]);
      state.history = ['reports'];
      state.view = 'report-detail';
      render('enter');
    } else {
      go(target);
    }
  });

  // Optional hash route for direct linking (e.g. #analyst, #report-detail, #push)
  const hash = (location.hash || '').replace(/^#/, '');
  if (hash === 'push') {
    render('fade');
    triggerPush();
  } else if (stageMeta[hash]) {
    if (hash === 'alert-detail') state.history = ['alerts'];
    if (hash === 'report-detail') state.history = ['reports'];
    if (hash === 'profile' || hash === 'actor-detail') state.history = ['home'];
    state.view = hash;
    render('fade');
  } else {
    render('fade');
  }
})();
