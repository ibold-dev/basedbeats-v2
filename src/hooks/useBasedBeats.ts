import { encodeFunctionData } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { BasedBeats, basedBeatsAbi } from "@/lib/basedbeats";

// Write function encoders
export const useBasedBeatsWrite = () => {
  const createTrack = (metadataCid: string) => {
    return encodeFunctionData({
      abi: basedBeatsAbi,
      functionName: "createTrack",
      args: [metadataCid],
    });
  };

  const like = (trackId: bigint) => {
    return encodeFunctionData({
      abi: basedBeatsAbi,
      functionName: "like",
      args: [trackId],
    });
  };

  const tip = (trackId: bigint) => {
    return encodeFunctionData({
      abi: basedBeatsAbi,
      functionName: "tip",
      args: [trackId],
    });
  };

  const setTipPreference = (amount: bigint) => {
    return encodeFunctionData({
      abi: basedBeatsAbi,
      functionName: "setTipPreference",
      args: [amount],
    });
  };

  const transferOwnership = (newOwner: `0x${string}`) => {
    return encodeFunctionData({
      abi: basedBeatsAbi,
      functionName: "transferOwnership",
      args: [newOwner],
    });
  };

  const renounceOwnership = () => {
    return encodeFunctionData({
      abi: basedBeatsAbi,
      functionName: "renounceOwnership",
    });
  };

  return {
    createTrack,
    like,
    tip,
    setTipPreference,
    transferOwnership,
    renounceOwnership,
  };
};

// Read hooks
export const useGetTrack = (trackId: bigint, enabled = true) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "getTrack",
    args: [trackId],
    query: {
      enabled,
    },
  });
};

export const useGetAllTracks = (
  offset: bigint,
  limit: bigint,
  enabled = true
) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "getAllTracks",
    args: [offset, limit],
    query: {
      enabled,
    },
  });
};

export const useGetCreatorTracks = (
  creator: `0x${string}`,
  offset: bigint,
  limit: bigint,
  enabled = true
) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "getCreatorTracks",
    args: [creator, offset, limit],
    query: {
      enabled: enabled && !!creator,
    },
  });
};

export const useGetTracksBatch = (trackIds: bigint[], enabled = true) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "getTracksBatch",
    args: [trackIds],
    query: {
      enabled: enabled && trackIds.length > 0,
    },
  });
};

export const useGetUserLikedTracks = (
  user: `0x${string}`,
  offset: bigint,
  limit: bigint,
  enabled = true
) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "getUserLikedTracks",
    args: [user, offset, limit],
    query: {
      enabled: enabled && !!user,
    },
  });
};

export const useHasLiked = (
  trackId: bigint,
  user: `0x${string}`,
  enabled = true
) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "hasLiked",
    args: [trackId, user],
    query: {
      enabled: enabled && !!user,
    },
  });
};

export const useGetTipPreferences = (user: `0x${string}`, enabled = true) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "tipPreferences",
    args: [user],
    query: {
      enabled: enabled && !!user,
    },
  });
};

export const useBasedBeatsConstants = () => {
  return useReadContracts({
    contracts: [
      {
        address: BasedBeats.address,
        abi: basedBeatsAbi,
        functionName: "owner",
      },
      {
        address: BasedBeats.address,
        abi: basedBeatsAbi,
        functionName: "tipAmount",
      },
      {
        address: BasedBeats.address,
        abi: basedBeatsAbi,
        functionName: "usdc",
      },
    ],
  });
};

// Single constant hooks
export const useGetOwner = (enabled = true) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "owner",
    query: {
      enabled,
    },
  });
};

export const useGetTipAmount = (enabled = true) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "tipAmount",
    query: {
      enabled,
    },
  });
};

export const useGetUsdcAddress = (enabled = true) => {
  return useReadContract({
    address: BasedBeats.address,
    abi: basedBeatsAbi,
    functionName: "usdc",
    query: {
      enabled,
    },
  });
};
