import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Cpu,
  History,
  Leaf,
  LockKeyhole,
  ScanLine,
  Sparkles,
  UploadCloud,
  Zap,
  FileCheck2,
} from 'lucide-react';
import { Reveal } from '@/components/common/PageTransition';
import { Footer } from '@/components/layout/Footer';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { buttonStyles } from '@/components/ui/Button';
import { DISEASE_LIST } from '@/lib/diseases';

const features = [
  {
    icon: BrainCircuit,
    title: 'AI-Powered Classification',
    text: 'A trained Google Teachable Machine image model classifies leaf photos as Early Blight or Late Blight.',
  },
  {
    icon: Zap,
    title: 'Instant Image Analysis',
    text: 'Inference runs in your browser with TensorFlow.js, so results arrive moments after you click Analyze.',
  },
  {
    icon: History,
    title: 'Scan History',
    text: 'Save classifications with their images, then search, filter, sort, and export them whenever you need.',
  },
  {
    icon: BookOpen,
    title: 'Disease Insights',
    text: 'Read about symptoms, favourable conditions, prevention, and general management for each disease.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    text: 'See distribution, trends, and monthly activity calculated from your own saved scan records.',
  },
  {
    icon: LockKeyhole,
    title: 'Secure Cloud Storage',
    text: 'Scans live in a private Supabase bucket and database, protected by row-level security policies.',
  },
];

const steps = [
  {
    icon: UploadCloud,
    title: 'Upload a potato leaf image',
    text: 'Drag and drop a photo, browse your device, or capture one with your camera.',
  },
  {
    icon: Cpu,
    title: 'Analyze using the trained AI model',
    text: 'The image is resized to 224 × 224 and passed through the model on your device.',
  },
  {
    icon: FileCheck2,
    title: 'View classification results',
    text: 'See the predicted disease, the probability for each class, and practical guidance.',
  },
];

const heroFacts = [
  { value: '2', label: 'disease classes' },
  { value: '224²', label: 'pixel model input' },
  { value: '100%', label: 'in-browser inference' },
];

export function LandingPage() {
  return (
    <div className="bg-warm text-[#11281E]">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient pt-[72px] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="container relative grid items-center gap-12 py-14 sm:py-16 md:gap-14 lg:min-h-[620px] lg:grid-cols-[55fr_45fr] lg:gap-12 lg:py-16 xl:gap-16">
          {/* Text */}
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-mint backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI-powered plant health for potato growers
            </span>
            <h1 className="mt-5 text-[2.125rem] font-extrabold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.1] lg:text-[3.25rem] xl:text-[3.5rem]">
              Intelligent Potato Leaf <span className="text-soft">Blight Classification</span>
            </h1>
            <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-white/75 sm:text-lg">
              Upload a photo of a potato leaf and BlightVision’s trained image model tells you whether it looks more like
              Early Blight or Late Blight — with the probability for each, clear disease guidance, and a private history
              of every scan you save.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[460px]:flex-row">
              <Link to="/detect" className={buttonStyles({ variant: 'light', size: 'lg', className: 'px-7' })}>
                <ScanLine className="h-5 w-5" aria-hidden />
                Start Detection
              </Link>
              <Link to="/diseases" className={buttonStyles({ variant: 'glass', size: 'lg', className: 'px-7' })}>
                Explore Diseases
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {heroFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="sr-only">{fact.label}</dt>
                  <dd className="text-2xl font-extrabold text-white">{fact.value}</dd>
                  <dd className="mt-0.5 text-xs font-medium leading-snug text-white/55 sm:text-sm">{fact.label}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          {/* Image */}
          <motion.div
            className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:mr-0 lg:max-w-[460px]"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Decorative layers */}
            <div className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-soft/25 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -right-3 -top-3 h-full w-full rounded-3xl border border-soft/30" aria-hidden />
            <div
              className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 opacity-50"
              aria-hidden
              style={{ backgroundImage: 'radial-gradient(#74C69D 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }}
            />
            <span className="pointer-events-none absolute -left-2 -top-2 z-10 h-7 w-7 rounded-tl-xl border-l-2 border-t-2 border-soft" aria-hidden />
            <span className="pointer-events-none absolute -bottom-2 -right-2 z-10 h-7 w-7 rounded-br-xl border-b-2 border-r-2 border-soft" aria-hidden />

            <div className="relative overflow-hidden rounded-3xl border border-soft/40 shadow-[0_24px_60px_-18px_rgb(0_0_0/0.55)] ring-1 ring-white/10">
              <img
                src="/images/potato-leaves.jpg"
                alt="Healthy green potato plant leaves in sunlight"
                className="aspect-[46/41] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-transparent to-transparent" aria-hidden />
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-forest/70 p-3 backdrop-blur-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-forest">
                  <Leaf className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Early Blight · Late Blight</p>
                  <p className="text-xs leading-snug text-white/65">The two classes the model was trained to tell apart</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="h-10 rounded-t-[2.5rem] bg-warm" aria-hidden />
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 py-16 sm:py-24">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Features</p>
            <h2 className="mt-3 text-3xl font-extrabold text-forest sm:text-4xl">Everything you need for a clearer first look</h2>
            <p className="mt-4 text-base leading-relaxed text-[#4C675A]">
              From the moment you take a photo to the trends across a season, BlightVision keeps the workflow simple and honest.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={(index % 3) * 0.08}>
                <article className="group h-full rounded-2xl border border-[#DCEAE1] bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-soft hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <feature.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-forest">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4C675A]">{feature.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 bg-pale py-16 sm:py-24">
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold text-forest sm:text-4xl">Three steps from leaf to result</h2>
          </Reveal>
          <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16.67%] right-[16.67%] top-9 hidden border-t-2 border-dashed border-soft/60 md:block" aria-hidden />
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.1}>
                <li className="relative flex h-full flex-col items-center rounded-2xl border border-[#DCEAE1] bg-white p-7 text-center shadow-card">
                  <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-forest text-soft shadow-lift">
                    <step.icon className="h-8 w-8" aria-hidden />
                    <span className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-soft text-xs font-extrabold text-forest ring-4 ring-white">
                      {index + 1}
                    </span>
                  </span>
                  <h3 className="mt-6 text-lg font-bold text-forest">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4C675A]">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Disease preview */}
      <section id="diseases" className="scroll-mt-24 py-16 sm:py-24">
        <div className="container">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Disease preview</p>
              <h2 className="mt-3 text-3xl font-extrabold text-forest sm:text-4xl">Know the two blights</h2>
              <p className="mt-4 text-base leading-relaxed text-[#4C675A]">
                Early and late blight look different, spread differently, and favour different weather. Learn what to watch for.
              </p>
            </div>
            <Link to="/diseases" className={buttonStyles({ variant: 'outline', className: 'border-[#C4D9CC] bg-white text-forest hover:bg-pale' })}>
              Open the Disease Library
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {DISEASE_LIST.map((disease, index) => (
              <Reveal key={disease.slug} delay={index * 0.1}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#DCEAE1] bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={disease.image.src}
                      alt={disease.image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest/75 via-forest/10 to-transparent" aria-hidden />
                    <div className="absolute inset-x-6 bottom-5">
                      <h3 className="text-2xl font-extrabold text-white">{disease.name}</h3>
                      <p className="text-sm text-white/80">
                        <span className="italic">{disease.agent}</span> · {disease.agentType}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-7">
                    <p className="text-sm leading-relaxed text-[#4C675A]">{disease.description}</p>
                    <ul className="mt-5 space-y-2.5">
                      {disease.symptoms.slice(0, 3).map((symptom) => (
                        <li key={symptom} className="flex gap-2.5 text-sm leading-relaxed text-[#11281E]">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" aria-hidden />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={`/diseases#${disease.slug}`}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                    >
                      Read the full profile
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                    <p className="mt-auto pt-5 text-[11px] text-[#768E82]">{disease.image.credit}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-24">
        <div className="container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-hero-gradient px-6 py-14 text-center text-white sm:px-12 sm:py-16">
              <img src="/images/potato-field.jpg" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-luminosity" />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to check a leaf?</h2>
                <p className="mt-4 text-base leading-relaxed text-white/75">
                  Detection works without an account. Create one when you want to save scans and follow your analytics.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/detect" className={buttonStyles({ variant: 'light', size: 'lg', className: 'px-7' })}>
                    <ScanLine className="h-5 w-5" aria-hidden />
                    Start Detection
                  </Link>
                  <Link to="/register" className={buttonStyles({ variant: 'glass', size: 'lg', className: 'px-7' })}>
                    Create a Free Account
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
