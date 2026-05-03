# Changelog

## \[0.6.1-beta] - 2026-05-03
* Historical alliance corrections and UI refinements.

## \[0.6.0-beta] - 2026-05-02 — "The Strategy \& Scandal Update"

### Added

* **New Strategic Actions**:

  * **Milo Tin Donation Drive**: Introduced a grassroots fundraising action that generates randomized Funds based on supporter engagement.
  * **Political Lobbying**: Introduced a strategic resource exchange allowing players to convert Funds into Political Capital ("Cash is King").
* **New Campaign Events**:

  * **Loose Cannon Series**: Added high-stakes internal coalition controversies (3R and MA63 remarks) that force players to choose between Stability and Popularity.
  * **Tycoon Bribe Offers**: Added "war chest" offers from corporate interests that provide immediate funding but carry long-term scandal risks.
* **Tiered Resource Replenishment**: Political Capital (PC) gains are now dynamically tied to government Stability:

  * **Stability > 85%**: +10 PC/turn
  * **Stability > 50%**: +5 PC/turn
  * **Stability ≤ 50%**: 0 PC (State of Crisis)
* **Custom Party Creator**: Launched a comprehensive system allowing players to create, edit, and delete their own political parties. Features include a zero-sum "Voter Base Split" engine to capture support from existing parties, custom color picking, and full integration into the Pre-Campaign strategy screen.
* **Custom Party Narrative**: Added specific campaign events (The Spoiler Allegation and Celebrity Endorsement) that trigger uniquely when playing with a custom party.

### Changed \& Rebalanced

* **Campaign Equilibrium**:

  * Reset starting conditions to **RM 15.0M Funds** and **100 PC** to allow for more early-game maneuverability.
  * Increased **Backlash Probability to 30%** for aggressive strategies (Smear Campaigns and Cyber Attacks).
  * Balanced base costs for offensive strategic actions to reflect their impact.
* **Narrative Rebalancing**:

  * **The Borneo Ultimatum**: Reduced Stability penalties significantly (-15/-10 instead of -35/-20) to prevent early-game collapse.
  * **Cost of Living Dilemma**: Choice consequences refined—Relief Funds now cost **RM 2.0M** (+5% Pop), while a "Media Statement" results in a **-2% National Popularity** penalty.
  * **The Stepchildren Narrative**: Balanced choice consequences—Commitment to Borneo now costs **5 PC** (was RM 1.0M) to better reflect political effort over financial cost.

### UI/UX Refinements

* **Dynamic Feedback**: Strategic notifications now explicitly display the exact RM amount collected from fundraising drives.
* **Notification Overhaul**: Consolidated success, failure, and backlash messages into a single feedback modal, standardized to a **6-second** duration for consistent readability.
* **Terminology Update**: Renamed "Social Blitz" to **Online Campaign** and "Policy Rally" to **National Address** for better clarity.
* **Coalition Transparency**: Added information icons to all post-campaign result pages (Tally, Result Inspector, and Outcome), allowing players to view the component parties of each coalition at a glance.
* **Auditory Cues**: Integrated a custom **Discordant Error SFX** to provide immediate feedback on action failures and backlash triggers.
* **Election Night Variety**: Added more variety and flavor to the election results news feed, including capture/loss statuses and randomized reporting styles for landslide and marginal outcomes.



### Fixed

* **State Synchronization**: Fixed a bug where resource deductions from event choices were occasionally being overwritten by simultaneous narrative updates.





## \[0.5.0-beta] - 2026-05-01

* Initial Beta release with core campaign mechanics.

