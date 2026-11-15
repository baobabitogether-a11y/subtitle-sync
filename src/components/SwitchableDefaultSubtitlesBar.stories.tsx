import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  SwitchableDefaultSubtitlesBar,
  type SwitchableDefaultSubtitlesBarProps,
} from "./SwitchableDefaultSubtitlesBar";
import type { Json3 } from "@/lib/subtitles";

/**
 * Mock Json3 fixtures with varied punctuation for story testing:
 * - English track with high comma density (15 commas)
 * - Spanish track with moderate comma density (6 commas)
 * - Hebrew track with few commas (2 commas)
 */
const mockTracks: Record<string, Json3> = {
  en: {
    wireMagic: "pb3",
    pens: [],
    wsWinStyles: [],
    wpWinPositions: [],
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "Hello, welcome back, my dear friends, to this tutorial." }],
      },
      {
        tStartMs: 4100,
        dDurationMs: 5000,
        segs: [
          {
            utf8: "In this lesson, we will learn, practice, and master, step by step, all concepts.",
          },
        ],
      },
      {
        tStartMs: 9200,
        dDurationMs: 4500,
        segs: [
          {
            utf8: "First, check the sound, then, watch the video, and finally, repeat aloud!",
          },
        ],
      },
      {
        tStartMs: 14000,
        dDurationMs: 3000,
        segs: [{ utf8: "Are you ready? Yes, let's start, right now." }],
      },
    ],
  },
  es: {
    wireMagic: "pb3",
    pens: [],
    wsWinStyles: [],
    wpWinPositions: [],
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "Hola, bienvenidos a este tutorial." }],
      },
      {
        tStartMs: 4100,
        dDurationMs: 5000,
        segs: [{ utf8: "En esta lección, aprenderemos paso a paso todos los conceptos." }],
      },
      {
        tStartMs: 9200,
        dDurationMs: 4500,
        segs: [{ utf8: "Primero, revise el sonido, y después, repita en voz alta." }],
      },
      {
        tStartMs: 14000,
        dDurationMs: 3000,
        segs: [{ utf8: "¿Estás listo? Sí, empecemos." }],
      },
    ],
  },
  he: {
    wireMagic: "pb3",
    pens: [],
    wsWinStyles: [],
    wpWinPositions: [],
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "שלום וברוכים הבאים למדריך זה." }],
      },
      {
        tStartMs: 4100,
        dDurationMs: 5000,
        segs: [{ utf8: "בשיעור זה נלמד צעד אחר צעד, את כל המושגים." }],
      },
      {
        tStartMs: 9200,
        dDurationMs: 4500,
        segs: [{ utf8: "ראשית נבדוק את השמע, ולאחר מכן נחזור בקול רם." }],
      },
      {
        tStartMs: 14000,
        dDurationMs: 3000,
        segs: [{ utf8: "האם אתם מוכנים? בואו נתחיל." }],
      },
    ],
  },
};

const meta: Meta<typeof SwitchableDefaultSubtitlesBar> = {
  title: "Components/SwitchableDefaultSubtitlesBar",
  component: SwitchableDefaultSubtitlesBar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Switchable list of default subtitle tracks featuring a recommendation icon for the track with the most commas (',') and an exposed punctuation statistics breakdown.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SwitchableDefaultSubtitlesBar>;

const SwitchableBarStoryWrapper: React.FC<Partial<SwitchableDefaultSubtitlesBarProps>> = (
  props,
) => {
  const [activeLang, setActiveLang] = useState<string>(props.activeLanguage || "en");
  const [activeApiTrackId, setActiveApiTrackId] = useState<string>("");

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 bg-background">
      <SwitchableDefaultSubtitlesBar
        videoId="L2Ryrr6txwA"
        defaultLanguages={["en", "es", "he"]}
        activeLanguage={activeLang}
        onSelectLanguage={setActiveLang}
        onResetToKingOfComma={() => setActiveLang("en")}
        tracks={mockTracks}
        activeApiTrackId={activeApiTrackId}
        onSwitchApiTrack={(entry) => {
          setActiveApiTrackId(entry.id);
          setActiveLang(entry.langCode);
        }}
        {...props}
      />
      <div className="text-xs text-muted-foreground font-mono">
        Active Selected Default / Mother Tongue:{" "}
        <span className="font-semibold text-primary">{activeLang}</span>
        {activeApiTrackId ? (
          <span className="ml-2 text-sky-600 dark:text-sky-400">
            (API Track: {activeApiTrackId})
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const WithCommaRecommendation: Story = {
  render: () => <SwitchableBarStoryWrapper />,
};

export const WithYouTubeApiDefaultAndAutoTranslation: Story = {
  render: () => (
    <SwitchableBarStoryWrapper
      availableCaptionTracks={[
        {
          langCode: "en",
          name: "English",
          isDefault: true,
          isAsr: false,
          trackUrl: "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3",
        },
        {
          langCode: "en",
          name: "English (auto-generated)",
          isDefault: false,
          isAsr: true,
          trackUrl:
            "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&kind=asr&fmt=json3",
        },
      ]}
      defaultApiLang="en"
      observedUrl="https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3"
      youtubeTranslatedLanguages={["he", "es"]}
      onRefreshApiTracks={() => {}}
    />
  ),
};

export const PreExpandedStatistics: Story = {
  render: () => <SwitchableBarStoryWrapper defaultExpandedStats={true} />,
};

export const KingOfCommaManualOverride: Story = {
  render: () => <SwitchableBarStoryWrapper activeLanguage="es" defaultExpandedStats={true} />,
};

export const SingleSubtitleTrack: Story = {
  render: () => (
    <SwitchableBarStoryWrapper
      defaultLanguages={["en"]}
      tracks={{ en: mockTracks.en }}
      activeLanguage="en"
    />
  ),
};

export const EmptyTracksFallback: Story = {
  render: () => <SwitchableBarStoryWrapper defaultLanguages={[]} tracks={{}} activeLanguage="" />,
};
