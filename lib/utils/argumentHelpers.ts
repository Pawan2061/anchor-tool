export function getArgumentDescription(
  argName: string,
  type: string
): string | null {
  const lowerName = argName.toLowerCase();

  if (lowerName.includes("quorum")) {
    return "Minimum number of votes required for a proposal to pass";
  }

  if (
    lowerName.includes("voting_window") ||
    lowerName.includes("votingwindow")
  ) {
    return "Duration of the voting period in seconds (e.g., 86400 = 1 day, 604800 = 1 week)";
  }

  if (lowerName.includes("fee") && lowerName.includes("percentage")) {
    return "Fee percentage, typically in basis points (100 = 1%, 250 = 2.5%)";
  }

  if (
    lowerName.includes("fee") &&
    (lowerName.includes("amount") || lowerName.includes("value"))
  ) {
    return "Fixed fee amount in the smallest unit (e.g., lamports for SOL, decimals for tokens)";
  }

  if (lowerName.includes("amount") || lowerName.includes("value")) {
    return "Amount in the smallest unit (e.g., lamports for SOL, decimals for tokens)";
  }

  if (
    lowerName.includes("time") ||
    lowerName.includes("duration") ||
    lowerName.includes("period")
  ) {
    return "Time duration in seconds (Unix timestamp or duration)";
  }

  if (lowerName.includes("percentage") || lowerName.includes("rate")) {
    return "Percentage value, typically in basis points (100 = 1%)";
  }

  if (
    lowerName.includes("count") ||
    lowerName.includes("limit") ||
    lowerName.includes("max")
  ) {
    return "Maximum count or limit value";
  }

  if (lowerName.includes("threshold")) {
    return "Minimum threshold value required";
  }

  if (lowerName.includes("id") || lowerName.includes("index")) {
    return "Unique identifier or index number";
  }

  return null;
}

export function getArgumentPlaceholder(argName: string, type: string): string {
  const lowerName = argName.toLowerCase();

  if (type === "u64" || type === "u32" || type === "u16" || type === "u8") {
    if (lowerName.includes("fee") || lowerName.includes("percentage")) {
      return "e.g., 100 (for 1%)";
    }
    if (
      lowerName.includes("quorum") ||
      lowerName.includes("count") ||
      lowerName.includes("limit")
    ) {
      return "e.g., 5, 10, 100";
    }
    if (lowerName.includes("amount") || lowerName.includes("value")) {
      return "e.g., 1000000";
    }
    return "Enter a positive number...";
  }

  if (type === "i64" || type === "i32" || type === "i16" || type === "i8") {
    if (
      lowerName.includes("time") ||
      lowerName.includes("duration") ||
      lowerName.includes("window")
    ) {
      return "e.g., 86400 (1 day), 604800 (1 week)";
    }
    return "Enter a number (can be negative)...";
  }

  if (type === "string") {
    return "Enter text...";
  }

  if (type === "bool") {
    return "";
  }

  if (type === "publicKey") {
    return "Enter public key...";
  }

  return `Enter ${type}...`;
}
