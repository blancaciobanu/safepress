import { AlertTriangle, Lock, MailWarning, MapPin } from 'lucide-react';

export const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Uneasy' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Confident' },
  { value: 5, label: 'Very confident' },
];

export const TRACKS = [
  {
    id: 'account-inbox',
    label: 'Accounts & inbox',
    desc: 'Credential traps and file lures',
    icon: MailWarning,
    accent: '#7B2E2E',
    drills: [
      {
        id: 'phishing-editor',
        label: 'Phishing',
        desc: 'Suspicious editor outreach',
        duration: '4-5 min',
        overview: 'A familiar editor asks for an urgent login and a file review while you are on deadline. The wrong instinct here burns both your account and your source trail.',
        learningGoals: [
          'Spot urgency and authority cues in newsroom phishing',
          'Choose verification steps that do not deepen compromise',
          'Sequence the first ten minutes after suspicion appears',
        ],
        steps: [
          {
            prompt: 'An email that looks like it came from your editor says the publishing system locked your account. It asks you to sign in through a link before the next edition closes.',
            context: 'You are on a live deadline and the sender display name matches your editor.',
            options: [
              {
                label: 'Open the link immediately so you do not hold the desk up',
                correct: false,
                outcome: 'The time pressure is the bait. Logging in through the supplied link risks handing over your newsroom credentials.',
                takeaway: 'Urgent account-recovery requests should be verified out-of-band before any sign-in.',
              },
              {
                label: 'Open the CMS from your own bookmark and message the editor in Signal to confirm',
                correct: true,
                outcome: 'Good call. You avoid the attacker-controlled link and verify the request in a separate channel you already trust.',
                takeaway: 'Use a known-good path and an independent channel when the message touches credentials.',
              },
              {
                label: 'Reply to the same email asking if this is legitimate',
                correct: false,
                outcome: 'Replying keeps you in the attacker\'s lane and does nothing to verify who controls the inbox you are answering.',
                takeaway: 'Never verify suspicious messages inside the same thread that raised the suspicion.',
              },
            ],
          },
          {
            prompt: 'Your editor replies on Signal: they did not send the email. You clicked the message but did not log in anywhere. What now?',
            context: 'You have not entered a password yet, but the browser tab is still open.',
            options: [
              {
                label: 'Close the tab, report the phish, and check whether the domain matches the real newsroom login page',
                correct: true,
                outcome: 'That contains the incident without feeding it. Reporting helps the newsroom warn others before the lure spreads.',
                takeaway: 'After a suspected phish, contain first, verify indicators, and notify the team quickly.',
              },
              {
                label: 'Ignore it because you never typed a password',
                correct: false,
                outcome: 'Ignoring it leaves the campaign active against the rest of the newsroom and wastes an early warning opportunity.',
                takeaway: 'Phishing response includes helping others avoid the same trap.',
              },
              {
                label: 'Forward the email to your personal account so you can inspect it later',
                correct: false,
                outcome: 'Forwarding a malicious lure to another account expands the blast radius and can strip useful headers in the process.',
                takeaway: 'Do not move suspicious artifacts into other accounts unless your response process calls for it.',
              },
            ],
          },
          {
            prompt: 'Later that day, you discover a colleague did enter their password into the same fake page. What is the best advice for their first move?',
            context: 'They still have access to their email and CMS account.',
            options: [
              {
                label: 'Change the password, revoke active sessions, and enable or re-check MFA immediately',
                correct: true,
                outcome: 'Yes. That is the shortest route to retaking the account before the attacker settles in.',
                takeaway: 'Credential compromise response starts with password reset, session revocation, and MFA review.',
              },
              {
                label: 'Wait to see if anything suspicious actually happens',
                correct: false,
                outcome: 'Waiting hands the attacker time to pivot, persist, and quietly collect source or newsroom data.',
                takeaway: 'Assume compromised credentials are active abuse until proven otherwise.',
              },
              {
                label: 'Delete the phishing email and carry on working',
                correct: false,
                outcome: 'Deleting the lure does not invalidate a stolen password or existing attacker session.',
                takeaway: 'Deleting evidence is not incident response.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Open Secure Setup', to: '/secure-setup' },
          { label: 'Open Manual', to: '/resources' },
        ],
      },
      {
        id: 'attachment-review',
        label: 'Attachment',
        desc: 'Trusted contact, risky file',
        duration: '4-5 min',
        overview: 'A person you work with often sends a document that looks ordinary enough, but the delivery method and timing make it risky to open casually on your main machine.',
        learningGoals: [
          'Separate source trust from file trust',
          'Choose safer review paths for unexpected documents',
          'Contain possible malware before it touches newsroom systems',
        ],
        steps: [
          {
            prompt: 'A long-time freelancer emails a Word document called "final_notes.docm" and asks you to open it quickly before a meeting.',
            context: 'The message tone sounds normal, but you were not expecting a file and the extension includes macros.',
            options: [
              {
                label: 'Open it right away because the sender is someone you already know',
                correct: false,
                outcome: 'Familiar senders are often exactly how malicious files reach trusted networks after an account compromise.',
                takeaway: 'Trust in the person does not automatically transfer to the file they send.',
              },
              {
                label: 'Verify the file out-of-band and inspect it in a safer environment before opening',
                correct: true,
                outcome: 'That keeps the decision calm and reduces the chance that your daily workstation becomes the first point of compromise.',
                takeaway: 'Unexpected files deserve verification and a lower-risk review path.',
              },
              {
                label: 'Forward it to a colleague to see whether it opens for them',
                correct: false,
                outcome: 'That turns uncertainty into a wider exposure problem and makes someone else take the first hit instead.',
                takeaway: 'Do not spread a suspicious attachment just to test it.',
              },
            ],
          },
          {
            prompt: 'The sender confirms they meant to send a draft, but they are surprised by the file extension and say they exported it on a borrowed laptop.',
            context: 'You still need the information inside the file.',
            options: [
              {
                label: 'Ask for the contents pasted into Signal or as a plain PDF while you continue investigating the original file',
                correct: true,
                outcome: 'Good. You separate the editorial need from the risky container and keep the work moving without normalizing the suspect file.',
                takeaway: 'You can preserve momentum without treating a suspicious file as business as usual.',
              },
              {
                label: 'Enable macros once, but disconnect Wi-Fi first',
                correct: false,
                outcome: 'Disconnecting does not make the file safe and it does not undo whatever executes locally once opened.',
                takeaway: 'A risky document does not become safe because you improvise around it.',
              },
              {
                label: 'Upload the file into your personal cloud drive and open it there',
                correct: false,
                outcome: 'That duplicates a suspicious artifact into another environment and may trigger previews or sync behavior you did not intend.',
                takeaway: 'Do not bounce uncertain files through extra services just to make them feel less immediate.',
              },
            ],
          },
          {
            prompt: 'You later learn two people in the newsroom received similar files from different contacts. What is the best next move?',
            context: 'No one is sure whether anyone opened the file yet.',
            options: [
              {
                label: 'Report the pattern internally and freeze opening behavior until the file set is reviewed',
                correct: true,
                outcome: 'Exactly. The pattern is the story now, and sharing it quickly helps contain a campaign before it lands everywhere.',
                takeaway: 'When multiple suspicious files appear, treat it like a coordinated incident, not an isolated annoyance.',
              },
              {
                label: 'Delete your copy and assume the rest of the newsroom will figure it out',
                correct: false,
                outcome: 'That leaves everyone else without your warning and keeps the campaign moving quietly.',
                takeaway: 'Containment depends on telling the team, not only cleaning up your own inbox.',
              },
              {
                label: 'Reply to the sender asking whether their device has malware',
                correct: false,
                outcome: 'That may be useful later, but it is not the first move while the newsroom still needs to contain the file campaign.',
                takeaway: 'Contain the shared risk first; attribution can wait a little.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Open Manual', to: '/resources?tab=tools' },
          { label: 'Request Specialist Support', to: '/request-support' },
        ],
      },
    ],
  },
  {
    id: 'sources-comms',
    label: 'Sources & comms',
    desc: 'First contact and metadata discipline',
    icon: Lock,
    accent: '#8A6D2C',
    drills: [
      {
        id: 'source-channel',
        label: 'Source contact',
        desc: 'Unsafe first-contact decisions',
        duration: '5-6 min',
        overview: 'A sensitive new source wants to talk fast, but they are reaching for the most convenient channel instead of the safest one.',
        learningGoals: [
          'Separate source trust from channel trust',
          'Choose a safer migration path for first contact',
          'Set retention and verification rules early',
        ],
        steps: [
          {
            prompt: 'A new source DMs you on Instagram: "I have documents about a minister. Can we talk here?"',
            context: 'They seem genuine and mention details that line up with your reporting beat.',
            options: [
              {
                label: 'Keep talking on Instagram so you do not lose them',
                correct: false,
                outcome: 'That keeps sensitive contact inside a platform built for profiling, retention, and account compromise.',
                takeaway: 'Convenient first contact is not safe first contact.',
              },
              {
                label: 'Move them to Signal or SecureDrop before discussing anything sensitive',
                correct: true,
                outcome: 'Exactly. You protect the substance of the contact before asking for specifics.',
                takeaway: 'Choose the secure channel before you deepen the relationship.',
              },
              {
                label: 'Ask them to email the documents to your newsroom account',
                correct: false,
                outcome: 'Work email is discoverable, retained, and often accessible across newsroom systems.',
                takeaway: 'Newsroom email should not be the first home for a high-risk source exchange.',
              },
            ],
          },
          {
            prompt: 'The source agrees to move to Signal, but they want to send names right away. You have not verified safety numbers yet.',
            context: 'They are anxious and say the situation is urgent.',
            options: [
              {
                label: 'Let them send the names because speed matters more right now',
                correct: false,
                outcome: 'Urgency is real, but unverified channels are precisely where sensitive names should not go first.',
                takeaway: 'If the channel is not verified, the most sensitive facts should wait.',
              },
              {
                label: 'Ask for non-identifying context first and verify the channel out-of-band before names',
                correct: true,
                outcome: 'Right. You keep the conversation moving without exposing the source at maximum depth immediately.',
                takeaway: 'You can gather shape and timeline before exposing identities.',
              },
              {
                label: 'Switch to a phone call because it feels more direct',
                correct: false,
                outcome: 'A call produces a dense metadata trail and offers less control over retention or interception.',
                takeaway: 'Direct is not the same thing as discreet.',
              },
            ],
          },
          {
            prompt: 'You have verified the Signal channel. What should you agree on before documents start flowing regularly?',
            context: 'You expect the relationship to continue for weeks.',
            options: [
              {
                label: 'A disappearing-message window and what to do if either side feels watched',
                correct: true,
                outcome: 'Yes. Retention and go-dark rules should be normal practice, not crisis improvisation.',
                takeaway: 'Source safety improves when protocols are agreed before things get messy.',
              },
              {
                label: 'Nothing formal; too many rules may scare them off',
                correct: false,
                outcome: 'Without agreed rules, every future decision happens under pressure instead of protocol.',
                takeaway: 'Calm structure is often what makes a source feel protected rather than abandoned.',
              },
              {
                label: 'Your personal WhatsApp as an emergency fallback',
                correct: false,
                outcome: 'Fallbacks should reduce exposure, not jump back into more correlated personal channels.',
                takeaway: 'Do not casually bridge sensitive work back into personal comms.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Open Source Guide', to: '/resources?tab=source-protection' },
          { label: 'Continue in AI Advisor', to: '/ai-advisor' },
        ],
      },
      {
        id: 'source-fallback',
        label: 'Fallback channel',
        desc: 'Pressure to move somewhere sloppier',
        duration: '4-5 min',
        overview: 'A source starts in a safer channel, then drifts toward convenience once things get messy. The risk is not only what they send, but where the thread migrates.',
        learningGoals: [
          'Hold the line when pressure pushes communication into weaker channels',
          'Offer safer alternatives without freezing the source out',
          'Recognize how fallback habits create metadata exposure',
        ],
        steps: [
          {
            prompt: 'A source on Signal says they cannot get messages through and asks to continue over your personal WhatsApp because "it\'s faster right now."',
            context: 'You already know the conversation could become sensitive again within minutes.',
            options: [
              {
                label: 'Switch to WhatsApp so the conversation does not stall',
                correct: false,
                outcome: 'You may keep the conversation alive, but you also collapse your boundary between safer source practice and a more correlated personal channel.',
                takeaway: 'A little convenience can quietly unwind a lot of source discipline.',
              },
              {
                label: 'Offer a safer fallback you have already prepared, such as SecureDrop or a second verified Signal path',
                correct: true,
                outcome: 'That keeps momentum without abandoning the communication rules that protect both sides when the situation heats up again.',
                takeaway: 'Fallback plans should be safer by design, not invented in the panic moment.',
              },
              {
                label: 'Tell the source to wait silently until Signal fixes itself',
                correct: false,
                outcome: 'Going rigid can make the source improvise somewhere even worse without you.',
                takeaway: 'The goal is safer continuity, not silence for its own sake.',
              },
            ],
          },
          {
            prompt: 'The source says they only have access to a work laptop and can send from their company email right now.',
            context: 'They want to forward screenshots and a short explanation immediately.',
            options: [
              {
                label: 'Accept the email and ask them to include as much detail as possible while they have the chance',
                correct: false,
                outcome: 'That normalizes a heavily monitored channel and encourages the source to expose themselves in a place built for discovery and retention.',
                takeaway: 'Do not let urgency make a monitored channel feel suddenly acceptable for sensitive detail.',
              },
              {
                label: 'Ask for a non-identifying summary only, then move the conversation back to a safer path as soon as possible',
                correct: true,
                outcome: 'Good. You get enough shape to stay oriented without inviting the highest-risk material into an exposed channel.',
                takeaway: 'When a weak channel is unavoidable, keep the substance shallow.',
              },
              {
                label: 'Call them on your personal number instead',
                correct: false,
                outcome: 'That may feel more direct, but it still produces a strong metadata trail and drags the contact into a more personal lane.',
                takeaway: 'Moving fast is not the same as reducing exposure.',
              },
            ],
          },
          {
            prompt: 'Later, the source apologizes for the disruption and wants advice on what to set up before the next exchange.',
            context: 'This is the best calm window you have had since the problem began.',
            options: [
              {
                label: 'Agree on backup channels, verification rituals, and what not to send unless the safer path is restored',
                correct: true,
                outcome: 'Exactly. This is where you turn a shaky episode into a more resilient protocol for the next one.',
                takeaway: 'The strongest source safety practices are agreed before the next emergency, not during it.',
              },
              {
                label: 'Keep the process informal so the source does not feel burdened',
                correct: false,
                outcome: 'Informality now just means the next breakdown will be improvised again under stress.',
                takeaway: 'Protocol is often what makes future contact calmer, not more intimidating.',
              },
              {
                label: 'Tell them to just use whatever feels safest in the moment',
                correct: false,
                outcome: 'Intuition under pressure is useful, but not enough without some pre-agreed boundaries and options.',
                takeaway: 'Source safety gets better when "whatever feels right" becomes a prepared playbook instead.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Open Source Guide', to: '/resources?tab=source-protection' },
          { label: 'Open Threat Model', to: '/threat-model' },
        ],
      },
    ],
  },
  {
    id: 'travel-devices',
    label: 'Travel & devices',
    desc: 'Crossings, confiscation, and risky networks',
    icon: MapPin,
    accent: '#375E5A',
    drills: [
      {
        id: 'border-search',
        label: 'Border crossing',
        desc: 'Device pressure at the checkpoint',
        duration: '5-6 min',
        overview: 'You are crossing a border after reporting on a sensitive story. Your device posture before the checkpoint determines how much harm a search can do.',
        learningGoals: [
          'Reduce what is carried into a high-surveillance crossing',
          'Choose the least damaging response under inspection pressure',
          'Think in advance about document, app, and contact minimisation',
        ],
        steps: [
          {
            prompt: 'The night before a cross-border trip, you still have source chat history and drafts on your main laptop. What is the best preparation step?',
            context: 'You have enough time to change your plan before travel day.',
            options: [
              {
                label: 'Travel with the same fully populated laptop because encryption is already enabled',
                correct: false,
                outcome: 'Encryption matters, but device minimisation matters too. A fully loaded machine is still a rich target if unlocked or seized.',
                takeaway: 'The safest data at a border is often the data you did not bring.',
              },
              {
                label: 'Use a cleaner travel device and strip non-essential source material before crossing',
                correct: true,
                outcome: 'Exactly. Minimise the data carried and separate sensitive work from routine travel where possible.',
                takeaway: 'Travel posture starts before you leave home, not at the checkpoint.',
              },
              {
                label: 'Export everything to cloud storage and delete it locally right before the airport',
                correct: false,
                outcome: 'Cloud copies may still be discoverable and deletion under time pressure is easy to do badly.',
                takeaway: 'Last-minute cloud shuffling is not a substitute for a deliberate travel plan.',
              },
            ],
          },
          {
            prompt: 'At the checkpoint, an officer asks you to unlock your phone for inspection.',
            context: 'Local law and newsroom counsel guidance vary, but you need to make the least harmful operational choice.',
            options: [
              {
                label: 'Open every app proactively to look cooperative',
                correct: false,
                outcome: 'Volunteering extra material expands the search beyond what is already being demanded.',
                takeaway: 'Never widen access beyond the immediate requirement.',
              },
              {
                label: 'Keep the device scope as limited as possible and avoid carrying sensitive content you cannot afford to expose',
                correct: true,
                outcome: 'That is the operational point of travel minimisation: if access is compelled, the device reveals far less.',
                takeaway: 'Preparation is what gives you options when legal leverage is limited.',
              },
              {
                label: 'Hand over your main newsroom laptop instead because the phone feels more personal',
                correct: false,
                outcome: 'The larger device may contain much richer caches, notes, downloads, and account access than the phone.',
                takeaway: 'Do not swap into a device with a worse blast radius.',
              },
            ],
          },
          {
            prompt: 'After the crossing, you think the device may have been examined more deeply than expected. What should you do next?',
            context: 'You are now away from the checkpoint and can contact your team.',
            options: [
              {
                label: 'Treat the device as potentially compromised and notify your newsroom or specialist support',
                correct: true,
                outcome: 'Yes. Post-crossing review matters because compromise may not announce itself immediately.',
                takeaway: 'Suspicion after a device search deserves containment, not shrugging.',
              },
              {
                label: 'Resume normal source contact on the same device to avoid disruption',
                correct: false,
                outcome: 'That risks carrying sensitive conversations forward on a device you no longer fully trust.',
                takeaway: 'Do not route fresh source contact through a possibly compromised device.',
              },
              {
                label: 'Wait a few weeks and only react if something obvious goes wrong',
                correct: false,
                outcome: 'Delayed response wastes the window when you could rotate credentials and isolate risk before follow-on harm.',
                takeaway: 'Uncertainty after a search is a reason to escalate carefully, not to go passive.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Request Specialist Support', to: '/request-support' },
          { label: 'Open Threat Model', to: '/threat-model' },
        ],
      },
      {
        id: 'hotel-network',
        label: 'Hotel network',
        desc: 'Uploads from a hostile connection',
        duration: '4-5 min',
        overview: 'You are traveling with a story package and only have a hotel network available. The temptation is to "just upload it quickly," but network convenience is not a neutral condition.',
        learningGoals: [
          'Recognize travel-network shortcuts that expose reporting work',
          'Prefer trusted routes over ambient convenience',
          'Minimize account and file exposure when working away from your normal setup',
        ],
        steps: [
          {
            prompt: 'You need to send notes and draft copy before an editor wakes up, and the only obvious connection is hotel Wi-Fi.',
            context: 'You are tired, on deadline, and the login page for the network looks ordinary.',
            options: [
              {
                label: 'Join immediately and start uploading the story materials',
                correct: false,
                outcome: 'That treats an unknown network like office infrastructure and exposes both your account session and the material itself to a riskier path.',
                takeaway: 'Urgency does not make an untrusted network trustworthy.',
              },
              {
                label: 'Use a trusted connection method you prepared for travel, or delay the sensitive upload until you have one',
                correct: true,
                outcome: 'Good. The safest travel workflows depend on trusted routes, not on hoping the ambient network behaves itself.',
                takeaway: 'Travel preparation is what keeps deadlines from dictating risky network choices.',
              },
              {
                label: 'Email the files to yourself first so you can upload them more easily once connected',
                correct: false,
                outcome: 'That duplicates the material into another account and still leaves the main network decision unresolved.',
                takeaway: 'Moving files around is not the same as reducing exposure.',
              },
            ],
          },
          {
            prompt: 'A pop-up on the hotel network asks you to re-enter your newsroom email password to keep the session alive.',
            context: 'The page uses your company logo, but you are not certain where it came from.',
            options: [
              {
                label: 'Type it in quickly since you are already connected anyway',
                correct: false,
                outcome: 'That is exactly when travel network hijacks and credential harvesting become effective: when the interruption feels routine.',
                takeaway: 'A network captive portal is not the place to normalize credential entry.',
              },
              {
                label: 'Close the prompt and re-authenticate only through a known-good newsroom path if needed',
                correct: true,
                outcome: 'Right. Even on the road, the rule stays the same: credentials belong in trusted systems you navigated to deliberately.',
                takeaway: 'Known-good paths matter even more when the surrounding network is noisy.',
              },
              {
                label: 'Ask the front desk if the prompt is legitimate and continue if they say yes',
                correct: false,
                outcome: 'Hotel staff may be well-meaning, but they are not a verification channel for your newsroom authentication flow.',
                takeaway: 'Operational verification should come from trusted systems, not local reassurance.',
              },
            ],
          },
          {
            prompt: 'You already uploaded a draft over the hotel network before you felt uneasy. What should you do once you are back on a trusted connection?',
            context: 'Nothing visibly bad has happened yet.',
            options: [
              {
                label: 'Review account sessions, rotate anything sensitive if needed, and tell your team what connection you used',
                correct: true,
                outcome: 'Exactly. Calm follow-up reduces the chance that a quiet compromise turns into a longer newsroom problem.',
                takeaway: 'When travel network decisions feel shaky in hindsight, treat that feeling as operational information.',
              },
              {
                label: 'Ignore it unless the account clearly locks you out',
                correct: false,
                outcome: 'Waiting for an obvious failure means giving up the time window when low-key cleanup is easiest.',
                takeaway: 'Not all damage announces itself dramatically.',
              },
              {
                label: 'Delete the uploaded draft from your sent folder and assume that fixes it',
                correct: false,
                outcome: 'Deletion does not address any session, credential, or network-level exposure that may have already happened.',
                takeaway: 'Evidence cleanup is not the same thing as exposure response.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Open Secure Setup', to: '/secure-setup' },
          { label: 'Open Threat Model', to: '/threat-model' },
        ],
      },
    ],
  },
  {
    id: 'public-pressure',
    label: 'Public pressure',
    desc: 'Impersonation, doxxing, and harassment',
    icon: AlertTriangle,
    accent: '#5E3B37',
    drills: [
      {
        id: 'impersonation-wave',
        label: 'Impersonation',
        desc: 'Fake account, real reputational damage',
        duration: '4-5 min',
        overview: 'A fake social account appears in your name and starts posting scams and inflammatory messages. The first goal is containment, not argument.',
        learningGoals: [
          'Prioritize containment over public back-and-forth',
          'Separate reputational harm from access compromise',
          'Escalate platform and support actions in the right order',
        ],
        steps: [
          {
            prompt: 'Friends start messaging that an account using your name and photo is posting scam links and tagging your contacts.',
            context: 'You do not yet know whether the fake account is separate from your real one or tied to a compromise.',
            options: [
              {
                label: 'Reply publicly under the fake posts to argue that the account is not yours',
                correct: false,
                outcome: 'Public argument burns energy but does little to contain the platform abuse or verify whether another account is also at risk.',
                takeaway: 'Start with containment and verification, not public debate.',
              },
              {
                label: 'Secure your real account, document the impersonation, and start platform reporting immediately',
                correct: true,
                outcome: 'That covers both possibilities at once: you protect your real access and preserve evidence while the takedown process begins.',
                takeaway: 'Impersonation response starts with account safety plus evidence, not just messaging.',
              },
              {
                label: 'Ignore it until the platform takes it down on its own',
                correct: false,
                outcome: 'That gives the fake account more time to reach people who trust your name.',
                takeaway: 'Impersonation gets more expensive the longer it runs unanswered.',
              },
            ],
          },
          {
            prompt: 'You confirm your real account is still under your control, but the fake profile is contacting your family and professional network.',
            context: 'You need to warn people without amplifying the scam further.',
            options: [
              {
                label: 'Send a calm warning through your verified channels and direct people to one known official account',
                correct: true,
                outcome: 'Good. You give people a clear reference point and reduce the chance that they keep chasing the fake account for clues.',
                takeaway: 'In a reputational incident, clarity beats volume.',
              },
              {
                label: 'Post screenshots of everything from every platform all at once',
                correct: false,
                outcome: 'That may amplify the fake material and make it harder for people to see the one message that matters.',
                takeaway: 'Warning people works best when it is simple and authoritative.',
              },
              {
                label: 'Focus only on messaging your editor and skip public clarification',
                correct: false,
                outcome: 'Your editor needs to know, but the wider audience still needs one clear signal about which channel is real.',
                takeaway: 'Internal escalation and external clarity usually need to happen together.',
              },
            ],
          },
          {
            prompt: 'The platform has not acted yet, and the fake account keeps posting. What is the best next escalation?',
            context: 'You have screenshots, timestamps, and a list of the most harmful posts.',
            options: [
              {
                label: 'Escalate with your newsroom or specialist support while continuing formal reports with evidence',
                correct: true,
                outcome: 'Yes. Documentation plus institutional backing improves your ability to get traction while protecting your own bandwidth.',
                takeaway: 'Persistent impersonation is a support issue, not a solo endurance test.',
              },
              {
                label: 'Keep refreshing the profile and responding to every new post yourself',
                correct: false,
                outcome: 'That keeps you trapped inside the attacker\'s tempo while doing little to improve the takedown path.',
                takeaway: 'Do not let the incident turn into a one-person live-monitoring job.',
              },
              {
                label: 'Delete your real profile so people cannot confuse the two',
                correct: false,
                outcome: 'Removing your verified presence may actually help the impersonator own the narrative for longer.',
                takeaway: 'Do not surrender your clearest authentic channel without a better plan.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Request Specialist Support', to: '/request-support' },
          { label: 'Continue in AI Advisor', to: '/ai-advisor' },
        ],
      },
      {
        id: 'doxxing-wave',
        label: 'Doxxing',
        desc: 'Private details surface publicly',
        duration: '5-6 min',
        overview: 'Private details are being posted publicly alongside threats. The temptation is to read and react to everything, but the safer move is structured containment.',
        learningGoals: [
          'Contain doxxing without self-amplifying the attack',
          'Preserve evidence while protecting your attention',
          'Separate urgent personal-safety actions from platform cleanup',
        ],
        steps: [
          {
            prompt: 'A thread appears with your address, phone number, and photos of your building, and people begin reposting it.',
            context: 'You feel the urge to watch the whole thread in real time.',
            options: [
              {
                label: 'Stay in the thread so you can monitor every new comment yourself',
                correct: false,
                outcome: 'That floods you with harm while making it harder to move into a clear response posture.',
                takeaway: 'Live exposure to doxxing is not the same as useful monitoring.',
              },
              {
                label: 'Capture evidence, tell trusted people, and start platform and safety escalation without staying inside the feed',
                correct: true,
                outcome: 'That preserves what matters while limiting the attack\'s grip on your attention and time.',
                takeaway: 'Doxxing response works best when evidence gathering and safety planning are deliberate.',
              },
              {
                label: 'Reply publicly asking people to stop sharing your information',
                correct: false,
                outcome: 'It is understandable, but it often increases engagement on the post without reliably reducing circulation.',
                takeaway: 'Public pleading rarely outperforms structured reporting and support.',
              },
            ],
          },
          {
            prompt: 'The thread names family members and claims they can be contacted for "comment."',
            context: 'You need to think about secondary exposure now, not just your own accounts.',
            options: [
              {
                label: 'Warn affected family or housemates, tighten privacy settings, and review immediate physical-safety steps',
                correct: true,
                outcome: 'Exactly. Doxxing is not only a platform problem; it is a network-of-people problem that needs quick protective action.',
                takeaway: 'The people around you often need notice and support early.',
              },
              {
                label: 'Wait until there is a direct threat before telling anyone close to you',
                correct: false,
                outcome: 'Delay leaves the people around you unaware of a risk that is already public and circulating.',
                takeaway: 'Early warning gives others time to protect themselves too.',
              },
              {
                label: 'Change your username and hope the thread loses interest',
                correct: false,
                outcome: 'Username changes may help later, but they do not address the already-exposed real-world details.',
                takeaway: 'Surface-level account tweaks are not the first line of doxxing response.',
              },
            ],
          },
          {
            prompt: 'The posts keep spreading overnight, and you are exhausted. What is the best way to keep going?',
            context: 'You have already documented the core evidence.',
            options: [
              {
                label: 'Shift monitoring and escalation support to trusted colleagues or specialists where possible',
                correct: true,
                outcome: 'Yes. Doxxing response is one of the clearest cases where sharing the operational load makes the response stronger.',
                takeaway: 'You do not need to be the sole operator in your own harassment incident.',
              },
              {
                label: 'Stay awake and keep handling all reporting yourself so nothing gets missed',
                correct: false,
                outcome: 'That increases burnout and reduces the quality of every decision after a certain point.',
                takeaway: 'Endurance is not the same as resilience.',
              },
              {
                label: 'Delete the screenshots because seeing them is upsetting',
                correct: false,
                outcome: 'The emotional reaction is real, but deleting the record undercuts future support and reporting options.',
                takeaway: 'Protect yourself from exposure to the content without erasing the evidence.',
              },
            ],
          },
        ],
        nextSteps: [
          { label: 'Request Specialist Support', to: '/request-support' },
          { label: 'Open Threat Model', to: '/threat-model' },
        ],
      },
    ],
  },
];
