import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Send, X, ShieldCheck, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'recipient';
  timestamp: string;
}

interface ChatUIProps {
  recipient: any;
  mode: 'CERCO' | 'OFFRO';
  onClose: () => void;
}

// Context-aware AI response engine
function generateResponse(userMessage: string, target: any, mode: string, history: Message[]): string {
  const msg = userMessage.toLowerCase().trim();

  // Track already-sent bot responses to avoid repetition
  const usedTexts = new Set(history.filter(m => m.sender === 'recipient').map(m => m.text));
  const pick = (arr: string[]): string => {
    const fresh = arr.filter(r => !usedTexts.has(r));
    const pool = fresh.length > 0 ? fresh : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Greetings
  if (msg.match(/^(ciao|ehi|hey|salve|buongiorno|buonasera|hola|yo|hello|hi\b)/)) {
    return pick([
      `Ciao! Piacere di conoscerti. Ho visto che abbiamo un'affinità alta, mi ha incuriosito molto il tuo profilo.`,
      `Ehi! Finalmente ci scriviamo. Che bello il match, avevo proprio notato il tuo profilo!`,
      `Ciao! Speravo nel match! Raccontami un po' di te, dai.`
    ]);
  }

  // Positive / agreement signals
  if (msg.match(/^(perfetto|ottimo|ok|bene|capito|certo|assolutamente|fantastico|benissimo|esatto|giusto|top|super|great|nice)[\s!.]*$/)) {
    return pick([
      `Ottimo! C'è qualcos'altro che vorresti sapere?`,
      `Perfetto, sono contento che ci siamo capiti! Hai altre domande?`,
      `Bene! Se vuoi possiamo anche organizzarci per vederci di persona, così chiarisci tutti i dubbi.`
    ]);
  }

  // Gratitude
  if (msg.match(/(grazie|ti ringrazio|thanks|thx)/)) {
    return pick([
      `Prego! Se hai altre domande sono qui.`,
      `Figurati! È importante che tu abbia tutte le info che ti servono.`,
      `Di niente! Scriviamo pure quando vuoi.`
    ]);
  }

  // Questions about the room/house size/details
  if (msg.match(/(stanza|camera|metr|spazio|spazi|grande|piccol|luminosa|finestra|letto|armadio|bagno|cucin)/)) {
    if (mode === 'CERCO') {
      return pick([
        `La stanza è molto accogliente, circa 14-16mq. Ha una bella finestra con tanta luce naturale. Vuoi che ti dica di più sulla zona giorno?`,
        `È una singola con armadio a muro e scrivania inclusa. Il bagno è condiviso ma in ottimo stato. Ti interessa sapere altro?`,
        `L'appartamento in totale è circa ${Math.floor(Math.random() * 30) + 60}mq, ben distribuito. La cucina è ampia e la usiamo tutti insieme, ma con rispetto degli spazi.`
      ]);
    } else {
      return pick([
        `Cerco una stanza singola, possibilmente luminosa. Mi basta un letto comodo e una scrivania per lavorare. Tu cosa offri?`,
        `Non ho bisogno di molto spazio, ma voglio che sia funzionale. Una finestra decente e un buon armadio mi bastano.`,
        `Finché c'è spazio per lavorare in pace e dormire comodamente sono a posto. Com'è la stanza che proponi?`
      ]);
    }
  }

  // Questions about price/costs
  if (msg.match(/(prezzo|costo|affitto|bollette|spese|quanto|budget|soldi|euro|€|paga)/)) {
    if (mode === 'CERCO') {
      return pick([
        `L'affitto è tutto incluso tranne le utenze, che si dividono in parti uguali. Di solito vengono circa 50-70€ al mese a testa. Nessuna sorpresa!`,
        `Il prezzo che vedi è comprensivo di tutte le spese condominiali. Solo luce e gas sono a parte, ma sono cifre ragionevoli.`,
        `Siamo su cifre oneste per la zona. E ti dico, rispetto ad altri appartamenti qui le utenze sono basse perché l'edificio è ben isolato.`
      ]);
    } else {
      return pick([
        `Il mio budget è tra i 400 e i 550€ al mese, spese incluse idealmente. Sono flessibile se la casa mi piace molto.`,
        `Non voglio strapagare, ma capisco che in centro i prezzi siano diversi. Fammi sapere il tuo range e vediamo.`,
        `Budget intorno ai 500€ tutto incluso. Però la qualità della convivenza vale anche qualcosa in più, se la persona è giusta.`
      ]);
    }
  }

  // Questions about zone/location/transport
  if (msg.match(/(zona|quartiere|metro|fermata|bus|tram|dove|posizione|vicin|lontana|distanza|trasport)/)) {
    return pick([
      `Siamo a 5 minuti a piedi dalla metro, la zona è tranquilla ma con tutto a portata di mano. Ci sono supermercati, bar, e un bel parco proprio dietro l'angolo.`,
      `La fermata del tram è a 2 minuti. Il quartiere è tranquillo ma vivace, perfetto secondo me.`,
      `La posizione è comodissima. In 15 minuti sei in centro, ma la zona non è caotica. È un bel compromesso.`
    ]);
  }

  // Work / study / remote work
  if (msg.match(/(lavoro|lavor|studi|università|smart working|ufficio|professione|freelance|remote|studio)/)) {
    if (target.personality === 'creative') {
      return pick([
        `Lavoro da casa come ${target.job?.split(' : ')[0] || 'freelance'}, quindi la mattina mi serve silenzio per concentrarmi. Ma dopo le 18 sono super disponibile per chiacchierare!`,
        `Sono un freelance, gli orari li gestisco io. Questo significa che a volte lavoro la mattina presto, a volte nel pomeriggio. Compatibile col tuo stile?`,
        `Il lavoro da casa per me è una cosa seria: ho bisogno di concentrazione nelle ore di punta. Il resto del tempo sono molto rilassato.`
      ]);
    } else if (target.personality === 'intellectual') {
      return pick([
        `Studio tanto e ho bisogno di concentrazione durante la settimana. Però il weekend mi stacco completamente, esco e mi rilasso.`,
        `Sono alla magistrale, sessioni intense. Durante la settimana ho bisogno di silenzio, soprattutto la sera. Il weekend invece sono libero.`,
        `Gli studi mi impegnano molto ma cerco di non portare lo stress in casa. È importante per me avere un ambiente sereno.`
      ]);
    } else {
      return pick([
        `Ho orari abbastanza flessibili. Di solito lavoro durante il giorno e la sera mi godo la casa. Tu che ritmi hai?`,
        `Vado in ufficio 3 giorni a settimana, il resto da casa. Non sono mai invadente, ma mi piace sapere che c'è vita intorno.`,
        `Il lavoro non mi porta via troppo tempo la sera. Di solito rientro entro le 19 e poi sono a disposizione.`
      ]);
    }
  }

  // Routine / sleep / habits
  if (msg.match(/(abitudin|routine|mattina|sera|svegli|ritmo|orari|notte|dormire|dormo|alzar)/)) {
    if (target.sleep === 'early_bird' || target.personality === 'structured') {
      return pick([
        `Sono piuttosto mattiniero, mi sveglio verso le 7 anche il weekend. La sera di solito sono a letto per le 23. E tu?`,
        `Amo la mattina, di solito mi faccio un caffè, leggo un po' e poi mi metto a lavorare. Orari abbastanza regolari.`,
        `Vado a dormire presto perché amo svegliarmi con calma. Se sei una persona che rispetta le ore notturne andiamo d'accordo.`
      ]);
    } else if (target.sleep === 'night_owl' || target.personality === 'bohemian') {
      return pick([
        `Tendo ad essere un po' nottambulo. Il weekend è raro che vada a dormire prima dell'una. Spero non sia un problema!`,
        `La sera è il mio momento: musica, un libro, o un film. Non faccio casino, ma vado a letto tardi. Sei una persona flessibile su questo?`,
        `Di mattina sono abbastanza umano, ma non aspettarti di vedermi alle 7 in cucina 😄 Il mio ritmo è più pomeriggio-sera.`
      ]);
    } else {
      return pick([
        `Sono piuttosto equilibrato, mi adatto facilmente. Basta che ci rispettiamo a vicenda sui rumori, il resto viene da sé.`,
        `Niente di estremo: mi sveglio verso le 8-9, vado a dormire verso mezzanotte. Orari normali.`,
        `Non sono né un gufo né un'allodola. Mi adatto abbastanza bene, l'importante è che non ci siano rumori forti dopo le 23.`
      ]);
    }
  }

  // Cleanliness / tidiness
  if (msg.match(/(pulizia|puliz|ordine|ordinat|sporco|disordine|riordinare|lavare|piatti|spazz)/)) {
    if (target.personality === 'structured' || target.clean === 'very_tidy') {
      return pick([
        `Sono molto ordinato, soprattutto in cucina. Lavo sempre i piatti subito dopo aver cucinato. Per me è fondamentale vivere in un ambiente pulito.`,
        `Pulizia è una priorità per me. Faccio una pulizia generale settimanale e tengo sempre in ordine le aree comuni. Spero sia anche per te!`,
        `Non sono ossessivo, ma tengo casa molto bene. La cucina soprattutto, che per me è un luogo sacro 😄`
      ]);
    } else if (target.personality === 'bohemian' || target.clean === 'relaxed') {
      return pick([
        `Onestamente non sono il tipo ossessivo con l'ordine, ma tengo pulito. Ogni tanto dimentico qualche tazza sul comodino, ma nulla di grave 😅`,
        `Sono abbastanza rilassato sull'ordine, ma non sono trascurato. Le aree comuni le tengo pulite, la mia stanza è affar mio.`,
        `Diciamo che non faccio le pulizie ogni giorno, ma una volta a settimana sì. E non lascio mai piatti sporchi in giro.`
      ]);
    } else {
      return pick([
        `Cerco un equilibrio: non sono maniaco dell'ordine ma nemmeno disordinato. Basta che le aree comuni siano sempre presentabili.`,
        `Un po' di pulizia di base è il minimo. Mi piace avere la cucina ordinata e il bagno pulito. Niente di esagerato.`,
        `Sono abbastanza in mezzo. Non sono il coinquilino che ti fa la morale se lasci una tazza sul tavolo, ma neanche quello che ignora il disordine per settimane.`
      ]);
    }
  }

  // Guests / social life / parties
  if (msg.match(/(amici|ospiti|gente|festa|feste|party|serata|serate|sociale|persone|compagnia|invitare)/)) {
    if (target.personality === 'energetic' || target.personality === 'vibey') {
      return pick([
        `Mi piace avere gente a casa, sì! Di solito il venerdì o sabato facciamo cena con amici. Ma niente feste selvagge, più tipo serate tranquille con vino e chiacchiere.`,
        `Casa aperta! Ma sempre con rispetto: si avvisa prima, si tiene il volume ragionevole dopo mezzanotte. È un patto che funziona benissimo.`,
        `Mi piace la compagnia, non ti nascondo. Ogni tanto organizziamo qualcosa, ma niente di caotico. Ti piace socializzare?`
      ]);
    } else if (target.personality === 'intellectual' || target.personality === 'structured') {
      return pick([
        `Ogni tanto invito qualche amico per cena, ma niente di caotico. Preferisco uscire piuttosto che fare casino in casa.`,
        `Non sono un tipo da feste in casa. Ogni tanto cena con pochi amici, ma niente che disturbi. La casa per me è un luogo di pace.`,
        `Raro che abbia gente a casa, onestamente. Preferisco uscire. Ma se tu hai amici che vengono, nessun problema finché è con rispetto.`
      ]);
    } else {
      return pick([
        `La casa è aperta agli amici, ma con rispetto. Di solito se organizzo qualcosa avviso prima, mi sembra il minimo.`,
        `Qualche serata ogni tanto sì, ma niente di esagerato. E ovviamente si avvisa il coinquilino. È una questione di rispetto reciproco.`,
        `Non sono né un eremita né un animale da festa. Un giusto mezzo, insomma.`
      ]);
    }
  }

  // Pets / animals
  if (msg.match(/(gatto|cane|animali|animale|pet|cucciolo)/)) {
    return pick([
      `Per ora niente animali in casa, ma non ho problemi se ne hai uno educato. Basta che non distrugga i mobili 😄`,
      `Non ho animali, ma li adoro! Se ne hai uno tranquillo è più che benvenuto.`,
      `Dipende dall'animale, ma in generale non ho pregiudizi. Un gatto silenzioso o un cane tranquillo? Nessun problema.`
    ]);
  }

  // Visit / appointment / meeting
  if (msg.match(/(veder|visit|venire|passare|incontrar|appuntamento|quando posso|vediamo|sopralluog)/)) {
    return pick([
      `Certo! Quando ti farebbe comodo? Io sono libero questo weekend, sabato pomeriggio o domenica mattina. Ti mostro tutto con calma.`,
      `Assolutamente, ti faccio vedere tutto di persona. Proponi tu un orario e mi organizzo.`,
      `Meglio vedersi dal vivo per decidere, hai ragione. Questo weekend o la settimana prossima ti va bene?`
    ]);
  }

  // Moving timeline / availability
  if (msg.match(/(trasfer|traslocare|disponibil|entrare|subito|da quando|entro quando|periodo)/)) {
    return pick([
      `La stanza è disponibile dal primo del mese prossimo. Se hai urgenza possiamo anche anticipare un po', ne parliamo!`,
      `Sono flessibile sulla data. Idealmente da inizio mese, ma se hai esigenze diverse ci accordiamo.`,
      `Dipende un po' dalla situazione attuale, ma in linea di massima entro 2-3 settimane è fattibile.`
    ]);
  }

  // Contract / legal / deposit
  if (msg.match(/(contratto|durata|mesi|caparra|deposito|cauzione|regolar|ricevuta|nero)/)) {
    return pick([
      `Facciamo contratto regolare transitorio, minimo 6 mesi rinnovabili. La cauzione è di un mese. Tutto in regola, niente nero.`,
      `Contratto in regola, sempre. Non mi piacciono le situazioni ambigue. Cauzione standard e ricevuta di pagamento ogni mese.`,
      `Tutto regolare: contratto registrato, cauzione di un mese, bollette divise equamente. Nessuna sorpresa.`
    ]);
  }

  // Parking / garage / bike
  if (msg.match(/(parcheggio|garage|macchina|auto|moto|bici|posto auto)/)) {
    return pick([
      `Purtroppo non c'è un garage incluso, ma il quartiere ha parcheggio abbastanza accessibile. Per la bici c'è spazio in cortile.`,
      `Non c'è un posto auto riservato, ma di solito si trova nelle vie limitrofe senza problemi. E il trasporto pubblico è ottimo comunque.`,
      `La bici la puoi tenere in cortile tranquillamente. Per la macchina ti dico la zona il giorno della visita.`
    ]);
  }

  // Music / noise / sound
  if (msg.match(/(musica|music|rumore|rumos|silenzio|cuffie|volume|suonar|strumento)/)) {
    if (target.personality === 'bohemian' || target.personality === 'vibey') {
      return pick([
        `La musica fa parte della mia vita! Non faccio casino la notte, ma di giorno mi piace avere un po' di sottofondo. Speriamo sia compatibile!`,
        `Ascolto musica quasi sempre, ma con le cuffie dopo le 22. Non voglio disturbare nessuno.`,
        `Ho una piccola collezione di vinili. La mattina metto qualcosa, ma mai a volume alto. È più un'atmosfera.`
      ]);
    } else {
      return pick([
        `Preferisco un ambiente tranquillo. Ascolto musica solo con le cuffie se sono tardi. Non sono il tipo che mette la cassa a palla.`,
        `Silenzio apprezzato! Non ho niente contro la musica, ma a volume ragionevole e non a tarda notte.`,
        `Di solito è una casa tranquilla. Qualche musica in sottofondo di giorno ci sta, ma niente di esagerato.`
      ]);
    }
  }

  // Food / cooking / kitchen
  if (msg.match(/(cucinar|mangiar|cibo|food|colazione|pranzo|cena|spesa|frigo|fornell)/)) {
    if (target.personality === 'structured' || target.personality === 'creative') {
      return pick([
        `Cucino spesso e con piacere! A volte faccio abbastanza per tutti se qualcuno è in casa. Amo sperimentare.`,
        `La cucina per me è sacra, nel senso buono. La tengo ordinate e mi piace molto cucinare. Tu cucini?`,
        `Di solito cucino la sera, qualcosa di semplice ma fatto bene. Ogni tanto preparo cose più elaborate il weekend.`
      ]);
    } else {
      return pick([
        `Cucino il necessario, niente di elaborato. Colazione e cena di solito, il pranzo spesso fuori.`,
        `Non sono un gran cuoco, ma mi arrangio. L'importante è lasciare la cucina pulita dopo.`,
        `Mangio sano, preparo cose semplici. Nessuna allergia o esigenza particolare.`
      ]);
    }
  }

  // Internet / Wi-Fi / streaming
  if (msg.match(/(wifi|wi-fi|internet|connessione|fibra|streaming|banda)/)) {
    return pick([
      `Il Wi-Fi è fibra ottica, velocissimo. Non abbiamo mai avuto problemi neanche con tutti connessi in contemporanea.`,
      `Connessione ottima, fibra. Se lavori da casa o fai streaming non avrai problemi.`,
      `Fibra inclusa nell'affitto. Non ho mai avuto lag o disconnessioni, funziona benissimo.`
    ]);
  }

  // Other flatmates / roommates
  if (msg.match(/(coinquilin|altri|quanti siete|altra persona|vivete|convivere|siamo in)/)) {
    return pick([
      `Siamo in due adesso, e cerchiamo la terza persona. L'appartamento è per tre ma è spazioso.`,
      `Al momento ci vivo solo io, quindi saremmo in due. Per me è la soluzione ideale.`,
      `Siamo già in due, cerchiamo un'altra persona che si inserisca bene nel gruppo. Non è un hotel, è una vera convivenza.`
    ]);
  }

  // Interests / hobbies / passions
  if (msg.match(/(hobby|passion|interes|sport|palestra|correr|libri|lettura|cinema|teatro|arte|viagg|foto)/)) {
    const hobbiesMap: Record<string, string[]> = {
      creative: [
        `Adoro l'arte e il design, è anche il mio lavoro. Nel tempo libero faccio fotografia e vado alle mostre.`,
        `Mi piace molto la fotografia e la musica. Ogni weekend cerco qualcosa di nuovo da esplorare in città.`
      ],
      energetic: [
        `Faccio sport quasi tutti i giorni! Corsa la mattina, palestra due volte a settimana. Tu sei sportivo?`,
        `Adoro stare all'aria aperta. Running, escursioni nel weekend, e ogni tanto qualche gara.`
      ],
      bohemian: [
        `Musica, cinema, libri e vinili. Sono abbastanza classico su questo. E tu?`,
        `Passo molto tempo a leggere e andare ai concerti. La cultura per me è essenziale.`
      ],
      structured: [
        `Mi piace cucinare e fare escursioni nel weekend. Gioco anche a scacchi, un po' nerd lo ammetto 😄`,
        `Cucina gourmet e qualche escursione in montagna. Sono abbastanza outdoors quando stacco dal lavoro.`
      ],
      intellectual: [
        `Leggo tanto, soprattutto saggistica e romanzi. E mi piace molto il cinema d'autore.`,
        `Studio, leggo, e nel tempo libero vado al cinema o a qualche conferenza. Sono abbastanza intellettualoide 😅`
      ],
      vibey: [
        `Musica, aperitivi, concerti. E vinili, tantissimi vinili. Tu ascolti musica?`,
        `Mi piace moltissimo esplorare la città, scoprire locali nuovi, andare a concerti. La vita va vissuta!`
      ]
    };
    const pool = hobbiesMap[target.personality] || hobbiesMap.creative;
    return pick(pool);
  }

  // Smart fallback - acknowledge what was said and redirect naturally
  const smartFallbacks: Record<string, string[]> = {
    creative: [
      `Interessante quello che dici! Sai, per me la cosa più importante in una convivenza è la comunicazione. Sei una persona diretta?`,
      `Ti capisco. Dimmi, cos'è la cosa principale che cerchi in un coinquilino?`,
      `Ha senso. Ogni convivenza è un equilibrio diverso. Cosa ti ha spinto a cercare proprio in questa zona?`
    ],
    energetic: [
      `Capito! Senti, hai altre domande sulla casa o su di me? Sono un libro aperto.`,
      `Mi piace la tua curiosità! C'è qualcosa di specifico su cui vuoi chiarezza prima di decidere?`,
      `Assolutamente. E tu, com'è la tua situazione attuale? Stai cercando da tanto?`
    ],
    bohemian: [
      `Interessante. Sai cosa mi ha colpito del tuo profilo? Sembra che tu abbia le idee chiare su cosa vuoi.`,
      `Capisco quello che intendi. Alla fine ognuno porta la sua energia in casa, no?`,
      `Ti rispondo volentieri. Cosa ti ha fatto pensare di venire in questa zona?`
    ],
    structured: [
      `Giusto. Se hai altre domande pratiche sulla casa o sulla convivenza, chiedi pure, sono molto diretto.`,
      `Capito. C'è altro che vorresti sapere per poter prendere una decisione informata?`,
      `Apprezzo la chiarezza. Se vuoi possiamo organizzare una visita così vedi tutto con i tuoi occhi.`
    ],
    intellectual: [
      `Ha senso. Penso che vedersi di persona aiuterebbe a capire meglio la compatibilità, no?`,
      `Capisco perfettamente. Hai altre domande sulla vita in casa o sulla zona?`,
      `Interessante prospettiva. Dimmi, cosa è più importante per te in una convivenza?`
    ],
    vibey: [
      `Sì! E sai cosa, penso che parlarsi di persona sia ancora meglio. Ti va un caffè prima di decidere?`,
      `Capito capito! Senti, hai altre domande o vuoi sapere qualcosa di specifico sulla casa?`,
      `Assolutamente! E tu, hai già visitato altri appartamenti o siamo la prima opzione?`
    ]
  };

  const pool = smartFallbacks[target.personality] || smartFallbacks.creative;
  return pick(pool);
}

const ChatUI: React.FC<ChatUIProps> = ({ recipient, mode, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasInitRef = useRef(false);

  const target = mode === 'CERCO' ? recipient.owner : recipient;

  useEffect(() => {
    gsap.fromTo(chatRef.current,
      { x: '100%' },
      { x: '0%', duration: 0.6, ease: 'power4.out' }
    );

    // Guard against React StrictMode double-invoke
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const greetings: Record<string, string> = {
      creative:     `Ciao! Ho visto il match, che bella sorpresa. Dimmi un po' di te, cosa cerchi nella convivenza ideale?`,
      energetic:    `Hey! Felicissima del match! Se hai domande sulla casa o vuoi sapere di più su di noi, chiedi pure 😊`,
      bohemian:     `Ciao! Che bello, avevo notato il tuo profilo. Se vuoi sapere qualcosa sulla casa o su di me, chiedi pure!`,
      structured:   `Ciao, piacere. Ho letto il tuo profilo e mi sembra che potremmo essere compatibili. Fammi sapere se hai domande.`,
      intellectual: `Ciao! Ho visto che abbiamo delle affinità interessanti. Se hai domande sulla stanza o sulla convivenza, sono qui.`,
      vibey:        `Ehi! Bel match! Dimmi tutto, cos'è che cerchi? La casa ha un'energia pazzesca, te la racconto volentieri.`
    };

    // Store timer ref for cleanup to prevent state updates after unmount
    const timer = setTimeout(() => {
      sendBotMessage(greetings[target.personality] || `Ciao! Piacere del match. Come stai?`);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendBotMessage = (text: string) => {
    setIsTyping(true);
    const delay = 1200 + text.length * 15 + Math.random() * 800;

    setTimeout(() => {
      setIsTyping(false);
      const newMessage: Message = {
        id: Date.now(),
        text,
        sender: 'recipient',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newMessage]);
    }, delay);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    
    const response = generateResponse(inputValue, target, mode, messages);
    setInputValue('');
    sendBotMessage(response);
    
    inputRef.current?.focus();
  };

  const handleClose = () => {
    gsap.to(chatRef.current, {
      x: '100%', duration: 0.5, ease: 'power4.in', onComplete: onClose
    });
  };

  return (
    <div ref={chatRef} className="chat-overlay">
      <div className="chat-header glass">
        <button className="back-btn" onClick={handleClose}><X /></button>
        <div className="chat-recipient-info">
          <div className="recipient-avatar" style={{ backgroundImage: `url(${target.image})` }}>
            <div className="online-indicator"></div>
          </div>
          <div>
            <h3>{target.name}</h3>
            <div className="match-badge">
              <ShieldCheck size={12} /> 
              Verificato • {recipient?.match}% Affinità
            </div>
          </div>
        </div>
        <Sparkles size={20} className="sparkle-active" />
      </div>

      <div ref={scrollRef} className="chat-messages">
        <div className="disclaimer">
          <p>Hai fatto match! Inizia la conversazione.</p>
        </div>
        
        {messages.map((m) => (
          <div key={m.id} className={`message-bubble ${m.sender}`}>
            <div className="message-content">
              {m.text}
              <span className="timestamp">{m.timestamp}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message-bubble recipient typing">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area glass">
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Scrivi un messaggio..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim() || isTyping}>
          <Send size={20} />
        </button>
      </div>

      <style>{`
        .chat-overlay { position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 450px; background: #05070a; z-index: 3000; display: flex; flex-direction: column; box-shadow: -20px 0 60px rgba(0,0,0,0.8); border-left: 1px solid rgba(255,255,255,0.05); }
        .chat-header { padding: 20px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .chat-recipient-info { flex: 1; display: flex; align-items: center; gap: 12px; }
        .recipient-avatar { width: 44px; height: 44px; border-radius: 50%; background-size: cover; background-position: center; position: relative; flex-shrink: 0; }
        .online-indicator { position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #4ade80; border: 2px solid #05070a; border-radius: 50%; }
        .chat-recipient-info h3 { font-size: 1.1rem; }
        .match-badge { font-size: 10px; color: var(--primary-blue); display: flex; align-items: center; gap: 4px; text-transform: uppercase; font-weight: 700; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .disclaimer { text-align: center; padding: 20px 0; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .message-bubble { max-width: 85%; display: flex; }
        .message-bubble.user { align-self: flex-end; }
        .message-bubble.recipient { align-self: flex-start; }
        .message-content { padding: 14px 18px; border-radius: 20px; font-size: 0.95rem; line-height: 1.5; }
        .message-bubble.user .message-content { background: var(--primary-blue); color: #000; border-bottom-right-radius: 4px; font-weight: 500; }
        .message-bubble.recipient .message-content { background: rgba(255,255,255,0.05); color: white; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.08); }
        .timestamp { display: block; font-size: 0.65rem; margin-top: 6px; opacity: 0.5; }
        .message-bubble.user .timestamp { text-align: right; }
        .typing-indicator { padding: 14px 18px; background: rgba(255,255,255,0.05); border-radius: 20px; display: flex; gap: 5px; align-items: center; }
        .typing-indicator span { width: 7px; height: 7px; background: var(--text-muted); border-radius: 50%; animation: typing-jump 1.4s infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-jump { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        .chat-input-area { padding: 24px; display: flex; gap: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
        .chat-input-area input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; padding: 14px 22px; color: white; font-family: inherit; font-size: 0.95rem; }
        .chat-input-area input:focus { outline: none; border-color: var(--primary-blue); }
        .send-btn { width: 48px; height: 48px; background: var(--primary-blue); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.3s; border: none; cursor: pointer; }
        .send-btn:disabled { opacity: 0.3; transform: scale(0.9); }
        .send-btn:hover:not(:disabled) { transform: scale(1.1); box-shadow: 0 0 20px var(--primary-blue); }
        .sparkle-active { color: var(--primary-blue); animation: spin 4s infinite linear; }
        .back-btn { background: none; border: none; color: white; cursor: pointer; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .chat-overlay { max-width: none; } }
      `}</style>
    </div>
  );
};

export default ChatUI;
