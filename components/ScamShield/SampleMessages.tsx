"use client"

interface Sample {
  label: string
  message: string
}

const SAMPLES: Sample[] = [
  {
    label: "WhatsApp Tip",
    message: `🚨 URGENT: MULTIBAGGER ALERT 🚨\n\nFriends, our operator sources have confirmed massive accumulation in XYZ SMALL CAP LTD (₹4.80). Promoters buying heavily. Target: ₹48 in 3 months — that's 10X guaranteed!\n\nJoin our VIP Telegram group NOW. Only 50 seats left. Pay ₹999 for lifetime access. Offer closes TONIGHT at midnight.\n\nSEBI registration? We don't need it — we have 5 years of PROVEN results!\n\nAct NOW or regret FOREVER! 💰💰💰`,
  },
  {
    label: "Telegram Channel",
    message: `📈 EXCLUSIVE INSIDER TIP — DO NOT SHARE\n\nOur sources inside the company confirm that a major FII is accumulating SUNRISE PHARMA before a big announcement next week. Stock currently at ₹12. Expected to hit ₹60 in 2 weeks.\n\nThis is RISK FREE. We have given 47 consecutive winning calls. Screenshot proof available.\n\nSend ₹2500 to UPI and get added to our Premium Group immediately. Limited to 20 people only.`,
  },
  {
    label: "SMS Alert",
    message: `FREE STOCK TIP: Buy RELIANCE at CMP for target 3200 in 1 month. Risk free trade. Our algo gave 94% accuracy last year. Subscribe to premium plan at ₹5000/month for daily guaranteed tips. WhatsApp JOIN to 98XXXXXXXX`,
  },
]

interface SampleMessagesProps {
  onSelect: (message: string) => void
}

export default function SampleMessages({ onSelect }: SampleMessagesProps) {
  return (
    <div className="mt-3">
      <span className="text-white/40 text-xs font-body">Try a sample:</span>
      <div className="flex gap-2 flex-wrap mt-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            onClick={() => onSelect(sample.message)}
            className="liquid-glass rounded-full px-3 py-1.5 text-xs text-white/60 hover:text-white cursor-pointer transition"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  )
}
