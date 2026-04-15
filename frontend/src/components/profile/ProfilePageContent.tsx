"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { RoleBadge } from "@/components/users/RoleBadge";
import { StatusBadge } from "@/components/users/StatusBadge";
import { updateProfileClient } from "@/lib/profile/client";
import type { Profile, UpdateProfileRequest } from "@/lib/profile/types";

type ProfilePageContentProps = {
  initialProfile: Profile;
};

function formatDate(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitials(profile: Profile) {
  const source = profile.displayName || profile.email;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRoleSummary(profile: Profile) {
  switch (profile.role) {
    case "STUDENT":
      return "Your student access is managed through Google sign-in and your personal campus workflows.";
    case "STAFF":
      return "Your staff account uses local credentials for day-to-day operational work in SmartCampus.";
    case "ADMIN":
      return "Your admin account uses local credentials and includes platform oversight responsibilities.";
  }
}

function getLoginMethodLabel(profile: Profile) {
  return profile.loginMethod === "GOOGLE" ? "Google sign-in" : "Email and password";
}

function getCredentialSummary(profile: Profile) {
  if (profile.loginMethod === "GOOGLE") {
    return "Google-managed account";
  }

  if (!profile.hasLocalCredentials) {
    return "Local login not created";
  }

  if (profile.mustChangePassword) {
    return "Local login with password change pending";
  }

  return "Local login ready";
}

function normalizePayload(formState: UpdateProfileRequest): UpdateProfileRequest {
  const normalize = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  return {
    firstName: normalize(formState.firstName),
    lastName: normalize(formState.lastName),
    displayName: normalize(formState.displayName),
    phone: normalize(formState.phone),
    profileImageUrl: normalize(formState.profileImageUrl),
  };
}

function getContextCard(profile: Profile) {
  switch (profile.role) {
    case "STUDENT":
      return {
        title: "Student access",
        description:
          "Use this account area to keep your SmartCampus identity up to date while Google continues to manage your sign-in.",
        links: [
          { href: "/bookings", label: "Go to bookings" },
          { href: "/tickets", label: "Go to tickets" },
        ],
      };
    case "STAFF":
      return {
        title: "Staff access",
        description:
          "Your account supports local sign-in and the ticket workflow responsibilities assigned to staff users.",
        links: [{ href: "/tickets", label: "Go to tickets" }],
      };
    case "ADMIN":
      return {
        title: "Admin access",
        description:
          "Your account supports local sign-in and gives you access to platform-wide operational and user-management workflows.",
        links: [
          { href: "/users", label: "Go to users" },
          { href: "/notifications", label: "Go to notifications" },
        ],
      };
  }
}

export function ProfilePageContent({ initialProfile }: ProfilePageContentProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [formState, setFormState] = useState<UpdateProfileRequest>({
    firstName: initialProfile.firstName ?? "",
    lastName: initialProfile.lastName ?? "",
    displayName: initialProfile.displayName ?? "",
    phone: initialProfile.phone ?? "",
    profileImageUrl: initialProfile.profileImageUrl ?? "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const contextCard = getContextCard(profile);

  const resetForm = () => {
    setFormState({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      displayName: profile.displayName ?? "",
      phone: profile.phone ?? "",
      profileImageUrl: profile.profileImageUrl ?? "",
    });
    setErrorMessage(null);
    setFeedback(null);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={`${profile.displayName} profile`}
                className="h-20 w-20 rounded-[1.5rem] object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-slate-950 text-xl font-semibold text-white">
                {getInitials(profile)}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Account area
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {profile.displayName}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{profile.email}</p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {getRoleSummary(profile)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <RoleBadge role={profile.role} />
            <StatusBadge status={profile.status} />
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {getLoginMethodLabel(profile)}
            </span>
          </div>
        </div>
      </div>

      {feedback ? (
        <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <section className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Personal details
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Edit your profile
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Keep your name, phone, and profile image current so the rest of the workspace reflects your identity clearly.
              </p>
            </div>

            <form
              className="mt-6 space-y-4"
              action={async () => {
                startTransition(async () => {
                  try {
                    setErrorMessage(null);
                    setFeedback(null);
                    const updatedProfile = await updateProfileClient(normalizePayload(formState));
                    setProfile(updatedProfile);
                    setFormState({
                      firstName: updatedProfile.firstName ?? "",
                      lastName: updatedProfile.lastName ?? "",
                      displayName: updatedProfile.displayName ?? "",
                      phone: updatedProfile.phone ?? "",
                      profileImageUrl: updatedProfile.profileImageUrl ?? "",
                    });
                    setFeedback("Profile updated.");
                    router.refresh();
                  } catch (error) {
                    setErrorMessage(
                      error instanceof Error ? error.message : "Could not save your profile right now.",
                    );
                  }
                });
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">First name</label>
                  <input
                    value={formState.firstName ?? ""}
                    onChange={(event) =>
                      setFormState({ ...formState, firstName: event.target.value })
                    }
                    placeholder="First name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Last name</label>
                  <input
                    value={formState.lastName ?? ""}
                    onChange={(event) =>
                      setFormState({ ...formState, lastName: event.target.value })
                    }
                    placeholder="Last name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Display name</label>
                  <input
                    value={formState.displayName ?? ""}
                    onChange={(event) =>
                      setFormState({ ...formState, displayName: event.target.value })
                    }
                    placeholder="Display name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    value={formState.phone ?? ""}
                    onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                    placeholder="Phone"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Profile image URL</label>
                  <input
                    value={formState.profileImageUrl ?? ""}
                    onChange={(event) =>
                      setFormState({ ...formState, profileImageUrl: event.target.value })
                    }
                    placeholder="https://example.com/profile.png"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={resetForm}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  {isPending ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Security
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Password and access
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Review how you sign in and update your password when local credentials are available.
              </p>
            </div>

            {profile.loginMethod === "GOOGLE" ? (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 text-sm leading-7 text-slate-600">
                Google manages sign-in for this account. Password changes are handled through your Google account rather than inside SmartCampus.
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-sm leading-7 text-slate-600">
                  This account uses local email and password credentials. Update your password here without leaving the profile page.
                </p>
                <div className="mt-5">
                  <ChangePasswordForm
                    redirectOnSuccess={null}
                    successMessage="Password updated successfully."
                    onSuccess={() => router.refresh()}
                    submitLabel="Save password"
                  />
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Account details
            </p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-900">Email</p>
                <p className="mt-1">{profile.email}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Effective role</p>
                <p className="mt-1">{profile.role}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Account status</p>
                <p className="mt-1">{profile.status}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Login method</p>
                <p className="mt-1">{getLoginMethodLabel(profile)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Credential state</p>
                <p className="mt-1">{getCredentialSummary(profile)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Created</p>
                <p className="mt-1">{formatDate(profile.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Last updated</p>
                <p className="mt-1">{formatDate(profile.updatedAt)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Last login</p>
                <p className="mt-1">{formatDate(profile.lastLoginAt)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {contextCard.title}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Role-aware guidance
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{contextCard.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {contextCard.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold !text-white no-underline transition hover:bg-slate-800 hover:!text-white visited:!text-white focus-visible:!text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        </section>
      </div>
    </section>
  );
}
