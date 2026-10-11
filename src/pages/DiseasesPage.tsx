import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bug, Camera, CloudSun, Eye, GraduationCap, ListChecks, Microscope, ScanLine, ShieldCheck, Stethoscope } from 'lucide-react';
import { Notice } from '@/components/common/Notice';
import { PageHeader } from '@/components/common/PageHeader';
import { Reveal } from '@/components/common/PageTransition';
import { Badge } from '@/components/ui/Badge';
import { buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CAPTURE_TIPS, COMPARISON_ROWS, DISEASE_LIST, FARMER_NOTES, type DiseaseInfo } from '@/lib/diseases';
import { cn } from '@/utils/cn';

function DetailBlock({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-alt p-5">
      <h4 className="flex items-center gap-2.5 text-sm font-bold text-ink">
        <span className="text-accent [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        {title}
      </h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-soft" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiseaseProfile({ disease }: { disease: DiseaseInfo }) {
  const isEarly = disease.name === 'Early Blight';
  return (
    <section id={disease.slug} className="scroll-mt-24" aria-labelledby={`${disease.slug}-title`}>
      <Card padded={false} className="overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <figure className="relative min-h-[260px] lg:min-h-full">
            <img src={disease.image.src} alt={disease.image.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-transparent to-transparent" aria-hidden />
            <figcaption className="absolute inset-x-4 bottom-3 text-[11px] text-white/80">{disease.image.credit}</figcaption>
          </figure>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge tone={isEarly ? 'early' : 'late'}>{disease.agentType}</Badge>
              <Badge tone="neutral">
                <Microscope className="h-3.5 w-3.5" aria-hidden />
                <span className="italic">{disease.agent}</span>
              </Badge>
            </div>
            <h2 id={`${disease.slug}-title`} className="mt-4 text-3xl font-extrabold text-ink">
              {disease.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-accent">{disease.tagline}</p>
            <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">Overview</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">{disease.overview}</p>
            <p className="mt-4 text-sm text-ink-muted">
              <span className="font-semibold text-ink">Causative agent:</span> <span className="italic">{disease.agent}</span> ({disease.agentType.toLowerCase()})
            </p>
          </div>
        </div>
        <div className="grid gap-4 border-t border-line p-6 sm:p-8 md:grid-cols-2">
          <DetailBlock icon={<Stethoscope />} title="Common symptoms" items={disease.symptoms} />
          <DetailBlock icon={<Eye />} title="Leaf appearance" items={disease.leafAppearance} />
          <DetailBlock icon={<CloudSun />} title="Favorable conditions" items={disease.favorableConditions} />
          <DetailBlock icon={<ShieldCheck />} title="Prevention" items={disease.prevention} />
          <div className="md:col-span-2">
            <DetailBlock icon={<ListChecks />} title="General management recommendations" items={disease.management} />
          </div>
        </div>
      </Card>
    </section>
  );
}

export function DiseasesPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    // Wait a frame so the target section has been laid out after the page transition.
    const timer = setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <div>
      <PageHeader
        eyebrow="Disease library"
        title="Early Blight & Late Blight"
        description="An educational reference to the two potato leaf diseases BlightVision classifies — what they look like, when they thrive, and general ways to reduce risk."
        actions={
          <Link to="/detect" className={buttonStyles()}>
            <ScanLine className="h-4 w-4" aria-hidden />
            Start Detection
          </Link>
        }
      />

      {/* Comparison cards */}
      <div className="grid gap-5 md:grid-cols-2">
        {DISEASE_LIST.map((disease) => {
          const isEarly = disease.name === 'Early Blight';
          return (
            <Card key={disease.slug} interactive className="relative overflow-hidden">
              <span className={cn('absolute inset-x-0 top-0 h-1', isEarly ? 'bg-early' : 'bg-late')} aria-hidden />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-ink">{disease.name}</h2>
                  <p className="mt-0.5 text-sm italic text-ink-muted">{disease.agent}</p>
                </div>
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isEarly ? 'bg-early-soft text-early-ink' : 'bg-late-soft text-late-ink')}>
                  <Bug className="h-5 w-5" aria-hidden />
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{disease.description}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-subtle p-3">
                  <dt className="text-xs font-semibold text-ink-faint">Favoured weather</dt>
                  <dd className="mt-1 font-semibold text-ink">{isEarly ? 'Warm, wet/dry cycles' : 'Cool and humid'}</dd>
                </div>
                <div className="rounded-xl bg-subtle p-3">
                  <dt className="text-xs font-semibold text-ink-faint">Typical lesion</dt>
                  <dd className="mt-1 font-semibold text-ink">{isEarly ? 'Ringed “target” spots' : 'Water-soaked patches'}</dd>
                </div>
              </dl>
              <a href={`#${disease.slug}`} className="mt-5 inline-block text-sm font-bold text-accent hover:underline">
                Jump to full profile ↓
              </a>
            </Card>
          );
        })}
      </div>

      {/* Comparison table */}
      <Reveal className="mt-8">
        <Card padded={false} className="overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-ink">Early Blight versus Late Blight</h2>
            <p className="mt-1 text-sm text-ink-muted">Typical differences. Field symptoms vary, and both diseases can occur together.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-t border-line text-left text-sm">
              <thead>
                <tr className="bg-surface-alt text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <th scope="col" className="px-5 py-3.5 sm:px-6">Feature</th>
                  <th scope="col" className="px-4 py-3.5">
                    <span className="flex items-center gap-2 text-early-ink">
                      <span className="h-2 w-2 rounded-full bg-early" aria-hidden />
                      Early Blight
                    </span>
                  </th>
                  <th scope="col" className="px-4 py-3.5 pr-6">
                    <span className="flex items-center gap-2 text-late-ink">
                      <span className="h-2 w-2 rounded-full bg-late" aria-hidden />
                      Late Blight
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-surface-alt">
                    <th scope="row" className="px-5 py-3.5 font-semibold text-ink sm:px-6">{row.feature}</th>
                    <td className="px-4 py-3.5 text-ink-muted">{row.early}</td>
                    <td className="px-4 py-3.5 pr-6 text-ink-muted">{row.late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>

      {/* Full profiles */}
      <div className="mt-8 space-y-8">
        {DISEASE_LIST.map((disease) => (
          <Reveal key={disease.slug}>
            <DiseaseProfile disease={disease} />
          </Reveal>
        ))}
      </div>

      {/* Capture tips */}
      <section id="capture-tips" className="mt-8 scroll-mt-24">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Camera className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-ink">Image capture tips</h2>
              <p className="text-sm text-ink-muted">Better photos give the model a fairer chance.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPTURE_TIPS.map((tip, index) => (
              <div key={tip.title} className="rounded-2xl border border-line bg-surface-alt p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-sm font-bold text-soft">{index + 1}</span>
                <h3 className="mt-3.5 text-sm font-bold text-ink">{tip.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{tip.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Farmer education */}
      <section className="mt-8">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-ink">For farmers and growers</h2>
              <p className="text-sm text-ink-muted">Good habits that support any disease management plan.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
            {FARMER_NOTES.map((note) => (
              <div key={note.title} className="border-l-2 border-soft pl-4">
                <h3 className="text-sm font-bold text-ink">{note.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{note.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Notice tone="info" title="Educational information only" className="mt-8">
        This library summarises general, widely taught information about potato blights. It is not a substitute for local
        expert advice, and no practice described here guarantees control. Disease pressure, registered products, and
        recommended practices differ by region — consult your agricultural extension service before treating a crop.
      </Notice>
    </div>
  );
}
