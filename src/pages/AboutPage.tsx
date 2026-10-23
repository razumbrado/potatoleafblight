import type { ReactNode } from 'react';
import { AlertTriangle, Database, GraduationCap, Lock, Microscope, Sprout, Target, Tractor, Users } from 'lucide-react';
import { Notice } from '@/components/common/Notice';
import { LogoMark } from '@/components/common/Logo';
import { PageHeader } from '@/components/common/PageHeader';
import { Reveal } from '@/components/common/PageTransition';
import { Card } from '@/components/ui/Card';
import { MODEL_DISCLAIMER } from '@/lib/constants';

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Reveal>
      <Card className="h-full">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-pine-100 text-pine-700 dark:bg-subtle dark:text-pine-300 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">{children}</div>
      </Card>
    </Reveal>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-soft" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const users = [
  { icon: Tractor, title: 'Farmers and growers', text: 'A quick first look at suspicious leaves before seeking advice.' },
  { icon: Users, title: 'Extension workers', text: 'A conversation aid when visiting fields and recording observations.' },
  { icon: GraduationCap, title: 'Students and educators', text: 'A hands-on example of applied image classification in agriculture.' },
  { icon: Microscope, title: 'Researchers', text: 'A simple tool for exploring model behaviour on leaf imagery.' },
];

export function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="About"
        title="About BlightVision"
        description="What the system does, how it works, who it is for — and, just as importantly, what it cannot do."
      />

      <Card padded={false} className="relative overflow-hidden bg-hero-gradient text-white">
        <img src="/images/potato-field.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15 mix-blend-luminosity" />
        <div className="relative flex flex-col gap-6 p-7 sm:p-10 lg:flex-row lg:items-center lg:gap-10">
          <LogoMark tone="onDark" className="h-16 w-16" />
          <div className="max-w-3xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">BlightVision overview</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
              BlightVision is a web application for potato leaf blight classification. You upload or capture a photo of a
              potato leaf, and a Random Forest classifier — trained with scikit-learn and served by a Python FastAPI
              backend — reports how strongly the image resembles Early Blight or Late Blight. Signed-in users can save results to a private
              cloud history and review them through an analytics dashboard.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section icon={<Sprout />} title="Purpose of the system">
          <p>
            Potato blights can reduce yield quickly, and early recognition gives growers more time to seek advice and
            respond. BlightVision aims to make a first, model-assisted look at a leaf fast and accessible on any phone
            or computer.
          </p>
          <p>It is designed to support — not replace — the judgement of agronomists, plant pathologists, and extension services.</p>
        </Section>

        <Section icon={<Target />} title="Project objectives">
          <Bullets
            items={[
              'Classify potato leaf images as Early Blight or Late Blight using a trained image model.',
              'Present the model’s real probabilities clearly, without overstating certainty.',
              'Give users a private, permanent record of the scans they choose to save.',
              'Summarise saved scans with analytics that reflect actual records only.',
              'Provide plain-language educational information about both diseases.',
            ]}
          />
        </Section>
      </div>

      <Reveal className="mt-5">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-pine-100 text-pine-700 dark:bg-subtle dark:text-pine-300">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="text-lg font-extrabold text-ink">Intended users</h2>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {users.map((user) => (
              <div key={user.title} className="rounded-2xl border border-line bg-surface-alt p-5">
                <user.icon className="h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-3 text-sm font-bold text-ink">{user.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{user.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section icon={<AlertTriangle />} title="System limitations">
          <Bullets
            items={[
              'The Random Forest was trained on two classes only. It has no “healthy” class and no “not a potato leaf” class.',
              'Any image — a healthy leaf, another crop, or an unrelated photo — still receives an Early Blight or Late Blight label.',
              'A high confidence value does not confirm disease, and a low one does not prove an image is invalid.',
              'Accuracy depends on the training images. Lighting, blur, backgrounds, leaf age, and other diseases can all mislead it.',
              'It cannot assess severity, stage, or the right treatment, and it has not been validated as a diagnostic tool.',
            ]}
          />
        </Section>

        <Section icon={<Lock />} title="Data privacy information">
          <Bullets
            items={[
              'To analyze an image, it is sent to the BlightVision Python backend, classified in memory, and not stored there.',
              'An image is uploaded only when you are signed in and choose “Save Result”.',
              <>Saved images go to a private Supabase Storage bucket; scan records go to a PostgreSQL table.</>,
              'Row-level security policies restrict every record and image to the account that created it.',
              'You can delete individual scans or clear your whole history at any time; stored images are removed with them.',
              'Only your name, email, and saved scans are stored. The app contains no advertising or tracking scripts.',
            ]}
          />
        </Section>
      </div>

      <Notice tone="warning" title="Responsible AI disclaimer" className="mt-5">
        {MODEL_DISCLAIMER} BlightVision is provided for educational and decision-support purposes. Its developers make no
        guarantee about the accuracy of any prediction, and crop management decisions remain the responsibility of the
        grower and their advisors.
      </Notice>

      <p className="mt-6 flex items-center gap-2 text-xs text-ink-faint">
        <Database className="h-3.5 w-3.5" aria-hidden />
        Photographs via Wikimedia Commons: Forest &amp; Kim Starr (CC BY 3.0); Linnea Stridh, Björn Andersson (SLU), Armineaghayan (CC BY-SA 4.0).
      </p>
    </div>
  );
}
