import React, { useState, useEffect, useRef } from "react";
import { Stack, Text, Title, TextInput, Button, Alert, Radio, ScrollArea, Group } from "@mantine/core";
import emojiRegex from 'emoji-regex';

const ensDomain = import.meta.env.VITE_ENS_DOMAIN || "inbox.eth";

function isValidSubname(name: string) {
  if (!name) return false;
  // Remove all emojis from the string
  const emojiRe = emojiRegex();
  const nameWithoutEmojis = name.replace(emojiRe, '');
  // Check that the rest contains only allowed characters
  const allowedRe = /^[a-zA-Z0-9-]+$/;
  // The name is valid if the non-emoji part is allowed and there are no dots or spaces
  return allowedRe.test(nameWithoutEmojis);
}

export const ENSRegistration: React.FC<{ address: string; onNameSelected?: (name: string | null) => void }> = ({ address, onNameSelected }) => {
  const [subname, setSubname] = useState("");
  const [checking, setChecking] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [subnameTouched, setSubnameTouched] = useState(false);

  const fullENS = subname ? `${subname}.${ensDomain}` : "";

  // Fetch existing ENS names for this address
  useEffect(() => {
    if (!address) return;
    setExistingNames([]);
    setSelectedName(null);
    setShowRegistration(true);
    fetch(`/api/namestone?address=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Map to full ENS names from API objects
          const names = data.map((n) => `${n.name}.${n.domain}`);
          // Prefer names ending with the configured domain
          const filtered = names.filter((n) => n.endsWith(`.${ensDomain}`));
          setExistingNames(filtered.length > 0 ? filtered : names);
        }
      })
      .catch(() => {});
  }, [address]);

  // Live check availability with debounce
  useEffect(() => {
    if (!isValidSubname(subname) || !showRegistration) {
      setAvailable(null);
      setError(null);
      return;
    }
    setChecking(true);
    setAvailable(null);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/namestone?name=${encodeURIComponent(subname)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAvailable(false);
          setError("ENS name is already taken.");
        } else {
          setAvailable(true);
          setError(null);
        }
      } catch (e) {
        setAvailable(null);
        setError("Error checking ENS name availability.");
      } finally {
        setChecking(false);
      }
    }, 500);
    // Cleanup on unmount
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [subname, showRegistration]);

  // Notify parent when selectedName changes
  useEffect(() => {
    if (onNameSelected) {
      onNameSelected(selectedName);
    }
  }, [selectedName, onNameSelected]);

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    setRegistering(true);
    try {
      const res = await fetch("/api/namestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subname, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Try again.");
        setSuccess(null);
      } else {
        setSuccess('registered');
        setError(null);
        setSubname("");
        setExistingNames((prev) => [...prev, fullENS]);
        setShowRegistration(false);
        setSelectedName(fullENS);
        if (onNameSelected) onNameSelected(fullENS);
      }
    } catch (e) {
      setError("Network error");
      setSuccess(null);
    }
    setRegistering(false);
  };

  return (
    <Stack align="center" gap="xs" w={350}>
      <Title order={4} size="sm">ENS Registration</Title>
      <Text size="sm">Register a subname on <b>.{ensDomain}</b> for: <b>{address}</b></Text>
      {existingNames.length > 0 && (
        <Stack w="100%" mb="sm">
          <Text size="sm" fw={500} mb={4}>Select an existing ENS name:</Text>
          <ScrollArea h={100} w="100%">
            <Radio.Group
              value={selectedName}
              onChange={(value) => {
                setSelectedName(value);
                setShowRegistration(false);
                setError(null);
                setSuccess(null);
                if (onNameSelected) onNameSelected(value);
              }}
            >
              <Stack>
                {existingNames.map((name) => (
                  <Radio key={name} value={name} label={name} />
                ))}
              </Stack>
            </Radio.Group>
          </ScrollArea>
          <Group justify="flex-end" mt={4}>
            <Button size="xs" variant="subtle" onClick={() => { setShowRegistration(true); setSelectedName(null); if (onNameSelected) onNameSelected(null); }}>Register new name</Button>
          </Group>
        </Stack>
      )}
      {(!selectedName || showRegistration) && (
        <>
          <TextInput
            label={`ENS Subname (will be registered as ".${ensDomain}")`}
            placeholder="yourname"
            value={subname}
            onChange={(e) => {
              setSubname(e.currentTarget.value);
              setAvailable(null);
              setError(null);
              setSuccess(null);
              setSubnameTouched(true);
            }}
            disabled={registering}
            error={!!error && error}
            w="100%"
          />
          {subnameTouched && subname && !isValidSubname(subname) && (
            <Alert color="red" w="100%" mt={4}>
              Invalid ENS subname. Only letters, numbers, hyphens, and emojis are allowed. No dots or spaces.
            </Alert>
          )}
          {subname && (
            <Text size="xs" c="dimmed" mb={-8}>
              Full ENS: <b>{fullENS}</b>
            </Text>
          )}
          {checking && (
            <Alert color="blue" w="100%" mt={4}>
              Checking availability...
            </Alert>
          )}
          {available === true && !success && (
            <Alert color="green" w="100%" mt={4}>
              ENS name is available!
            </Alert>
          )}
          {available === false && error && (
            <Alert color="red" w="100%" mt={4}>
              {error}
            </Alert>
          )}
          <Button
            size="sm"
            color="blue"
            onClick={handleRegister}
            loading={registering}
            disabled={!isValidSubname(subname) || !available || registering}
            mt={8}
          >
            Register ENS
          </Button>
        </>
      )}
      {/* Show success alert only after registration, not when selecting existing */}
      {success === 'registered' && selectedName && !showRegistration && (
        <Alert color="green" w="100%" mt={4}>
          Successfully registered and selected <b>{selectedName}</b>
          <Button size="xs" variant="subtle" ml={8} onClick={() => { setShowRegistration(true); setSelectedName(null); setSuccess(null); if (onNameSelected) onNameSelected(null); }}>Change</Button>
        </Alert>
      )}
      {/* Show selected ENS alert when picking existing name */}
      {!success && selectedName && !showRegistration && (
        <Alert color="green" w="100%" mt={4}>
          Selected ENS: <b>{selectedName}</b>
          <Button size="xs" variant="subtle" ml={8} onClick={() => { setShowRegistration(true); setSelectedName(null); if (onNameSelected) onNameSelected(null); }}>Change</Button>
        </Alert>
      )}
    </Stack>
  );
}; 