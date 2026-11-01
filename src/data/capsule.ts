/**
 * Configuration and copy for the Time Capsule (Feature F2).
 * Unlocks on 13 November 2027 at 00:00 IST.
 */

export const CAPSULE_CONFIG = {
  /** Timestamp when the capsule can be opened (IST) */
  unlockISO: '2027-11-13T00:00:00+05:30',
  maxChars: 1000,

  copy: {
    heading: 'a letter for later',
    headingHand: 'later',
    sub: 'write to 19-year-old you. it opens on 13 nov 2027. no peeking, not even me.',
    placeholder: 'dear me, next year...\n\nhow are you doing? are you still acting like an ungrateful potato? did you drink your water today? remember how much you are loved...',
    sealBtn: 'seal it',
    confirmModal: {
      title: 'seal this letter?',
      body: 'once it’s sealed it stays sealed till 13 nov 2027. no edits, no peeking. ready?',
      yes: 'yes, seal it with wax ♡',
      cancel: 'wait, let me edit',
    },
    lockedState: 'locked till 13 nov 2027',
    lockedNote: 'tucked into the vault. time will deliver it when you turn 19.',
    offlineNotice: 'the post office is closed right now. try again in a bit',
    toastSealed: 'sealed tight with wax and a heart ♡',
    ownerEnvelopeTitle: 'a note from mr. naz',
    ownerEnvelopeLocked: 'also sealed till 13 nov 2027 ♡',
  },
} as const
